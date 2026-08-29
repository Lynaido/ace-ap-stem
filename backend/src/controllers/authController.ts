import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { z } from 'zod';
import logger from '../config/logger';
import config from '../config/environment';
import { sendPasswordResetEmail } from '../services/emailService';
import type { CookieOptions } from 'express';

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string | null;
        role: string;
      };
    }
  }
}

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// JWT configuration
const JWT_SECRET = config.jwtSecret;
const JWT_REFRESH_SECRET = config.jwtRefreshSecret;
const JWT_EXPIRES_IN = config.jwtExpiresIn;
const JWT_REFRESH_EXPIRES_IN = config.jwtRefreshExpiresIn;
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const refreshCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  // The production frontend proxies API requests through the same site, so
  // Lax protects the refresh cookie without relying on third-party cookies.
  sameSite: 'lax',
  maxAge: REFRESH_COOKIE_MAX_AGE,
  path: '/',
});

const clearRefreshCookieOptions = (): CookieOptions => {
  const { maxAge, ...options } = refreshCookieOptions();
  return options;
};

// Generate tokens
const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as SignOptions);
  const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN } as SignOptions);

  return { accessToken, refreshToken };
};

// Generate secure random token for password reset
const generateSecureToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Hash token for secure storage
const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Register user
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password (10 rounds = ~100ms, good balance of security and speed)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Run database operations in parallel for better performance
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await Promise.all([
      // Create session
      prisma.session.create({
        data: {
          userId: user.id,
          refreshToken,
          expiresAt,
        },
      }),
      // Log event (non-blocking)
      prisma.event.create({
        data: {
          type: 'AUTH_REGISTER',
          userId: user.id,
          data: { email: user.email },
        },
      }),
    ]);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, refreshCookieOptions());

    res.status(201).json({
      message: 'User registered successfully',
      user,
      accessToken,
    });
    return; // Ensure all code paths return a value
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('Registration error:', error);
    return next(error);
  }
};

// Login user
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user (removed sessions include for faster query)
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Keep one session per browser/device. Only expired sessions are pruned.
    // This also removes the previous delete/create race that could erase the
    // newly-created session and force the user to sign in again.
    const expiresAt = new Date(Date.now() + REFRESH_COOKIE_MAX_AGE);
    await prisma.$transaction([
      prisma.session.deleteMany({
        where: { userId: user.id, expiresAt: { lte: new Date() } },
      }),
      prisma.session.create({
        data: {
          userId: user.id,
          refreshToken,
          expiresAt,
        },
      }),
      prisma.event.create({
        data: {
          type: 'AUTH_LOGIN',
          userId: user.id,
          data: { email: user.email },
        },
      }),
    ]);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, refreshCookieOptions());

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
      accessToken,
    });
    return; // Ensure all code paths return a value
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('Login error:', error);
    return next(error);
  }
};

// Refresh token
export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string };

    // Find session
    const session = await prisma.session.findFirst({
      where: {
        refreshToken,
        userId: decoded.userId,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(session.userId);

    // Update session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshToken,
        expiresAt,
      },
    });

    // Set new refresh token as httpOnly cookie
    res.cookie('refreshToken', newRefreshToken, refreshCookieOptions());

    res.json({
      message: 'Token refreshed successfully',
      accessToken,
    });
    return; // Ensure all code paths return a value
  } catch (error) {
    logger.error('Token refresh error:', error);
    return next(error);
  }
};

// Logout user
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      // Delete session
      await prisma.session.deleteMany({
        where: { refreshToken },
      });

      // Log event
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string };
      await prisma.event.create({
        data: {
          type: 'AUTH_LOGOUT',
          userId: decoded.userId,
          data: {},
        },
      });
    }

    // Clear cookie
    res.clearCookie('refreshToken', clearRefreshCookieOptions());
    res.json({ message: 'Logout successful' });
  } catch (error) {
    logger.error('Logout error:', error);
    next(error);
  }
};

// Get current user
export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
    return; // Ensure all code paths return a value
  } catch (error) {
    logger.error('Get user error:', error);
    return next(error);
  }
};

// Forgot Password - Request password reset
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    // Always return success to prevent email enumeration
    // Even if user doesn't exist, we return the same response
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, password: true },
    });

    // Only proceed if user exists AND has a password (not OAuth-only user)
    if (user && user.password) {
      // Delete any existing tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      // Generate new token
      const token = generateSecureToken();
      const tokenHash = hashToken(token);
      const expiresAt = new Date(Date.now() + config.passwordResetTokenExpiresHours * 60 * 60 * 1000);

      // Store hashed token
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      // Generate reset link
      const resetLink = `${config.frontendUrl}/reset-password?token=${token}`;

      // Send email and log result
      const emailSent = await sendPasswordResetEmail({
        to: user.email,
        userName: user.name || undefined,
        resetLink,
      });

      if (!emailSent) {
        logger.error(`Password reset email failed to send to ${user.email}`);
      }

      // Log event
      await prisma.event.create({
        data: {
          type: 'PASSWORD_RESET_REQUESTED',
          userId: user.id,
          data: { email: user.email },
        },
      });
    }

    // Same response regardless of whether user exists (security)
    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
    return;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('Forgot password error:', error);
    return next(error);
  }
};

// Reset Password - Set new password with token
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);

    // Hash the provided token to compare with stored hash
    const tokenHash = hashToken(token);

    // Find valid token
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: new Date() },
        usedAt: null, // Token hasn't been used
      },
      include: { user: true },
    });

    if (!resetToken) {
      return res.status(400).json({
        error: 'Invalid or expired reset token. Please request a new password reset.',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and mark token as used in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      // Invalidate all existing sessions for security
      prisma.session.deleteMany({
        where: { userId: resetToken.userId },
      }),
      // Log event
      prisma.event.create({
        data: {
          type: 'PASSWORD_RESET_COMPLETED',
          userId: resetToken.userId,
          data: {},
        },
      }),
    ]);

    logger.info(`Password reset completed for user ${resetToken.userId}`);

    res.json({
      message: 'Password has been reset successfully. Please sign in with your new password.',
    });
    return;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('Reset password error:', error);
    return next(error);
  }
};
