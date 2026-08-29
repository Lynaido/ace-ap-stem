import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import config from '../config/environment';

// CORS configuration
export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    try {
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);

      // Allow requests from the frontend URL (with or without www)
      if (origin === config.frontendUrl) {
        return callback(null, true);
      }

      // Allow www subdomain of frontend URL
      if (origin === `https://www.${config.frontendUrl.replace('https://', '')}`) {
        return callback(null, true);
      }

      // Preview deployments must be explicitly allow-listed. A broad
      // *.vercel.app rule would let an unrelated deployment send credentialed
      // requests to the API.
      if (config.allowedPreviewOrigins.includes(origin.replace(/\/$/, ''))) {
        return callback(null, true);
      }

      // Allow localhost for development
      if (config.nodeEnv === 'development' && origin.includes('localhost')) {
        return callback(null, true);
      }

      // Reject other origins
      return callback(new Error('Not allowed by CORS'), false);
    } catch (error) {
      console.error('CORS error:', error);
      return callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
};

// CORS middleware
export const corsMiddleware = cors(corsOptions);

const isTrustedBrowserOrigin = (origin: string): boolean => {
  const configuredFrontend = config.frontendUrl.replace(/\/$/, '');
  const configuredHost = configuredFrontend.replace(/^https?:\/\//, '').replace(/^www\./, '');

  return (
    origin === configuredFrontend ||
    origin === `https://www.${configuredHost}` ||
    origin === `https://${configuredHost}` ||
    config.allowedPreviewOrigins.includes(origin.replace(/\/$/, '')) ||
    (config.nodeEnv === 'development' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
  );
};

/**
 * Refresh and logout rely on an HttpOnly cookie. Requiring a trusted Origin
 * and a non-simple request header prevents another website from silently
 * rotating or clearing that cookie when SameSite=None is needed in production.
 */
export const verifyTrustedAuthRequest = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.get('origin');
  const requestedWith = req.get('x-requested-with');

  if (origin && !isTrustedBrowserOrigin(origin)) {
    return res.status(403).json({ error: 'Untrusted request origin' });
  }

  if (origin && requestedWith !== 'XMLHttpRequest') {
    return res.status(403).json({ error: 'Missing request verification header' });
  }

  return next();
};

// Helmet security middleware
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", config.frontendUrl],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// Rate limiting configuration
export const createRateLimit = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: {
        message,
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: Request) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/api/health';
    },
  });
};

// General API rate limiter
export const apiRateLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  'Too many requests from this IP, please try again later.'
);

// Auth rate limiter (stricter)
export const authRateLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // limit each IP to 5 requests per windowMs for auth endpoints
  'Too many authentication attempts, please try again later.'
);

// File upload rate limiter
export const uploadRateLimiter = createRateLimit(
  60 * 60 * 1000, // 1 hour
  10, // limit each IP to 10 uploads per hour
  'Too many file uploads, please try again later.'
);

// Request timeout middleware with intelligent timeout based on endpoint
export const timeoutMiddleware = (defaultTimeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Determine timeout based on request path
    let timeoutMs = defaultTimeoutMs;

    // AI-related endpoints need longer timeouts
    if (req.path.includes('/concept-notes') ||
        req.path.includes('/solutions') ||
        req.path.includes('/hints')) {
      timeoutMs = 180000; // 3 minutes for AI operations
    }
    // File uploads need longer timeouts
    else if (req.path.includes('/uploads')) {
      timeoutMs = 120000; // 2 minutes for file uploads
    }
    // Regular API endpoints use default timeout
    else {
      timeoutMs = defaultTimeoutMs; // 30 seconds for regular endpoints
    }

    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: {
            message: `Request timeout after ${timeoutMs / 1000} seconds`,
          },
        });
      }
    }, timeoutMs);

    // Clear timeout when response finishes
    res.on('finish', () => {
      clearTimeout(timeout);
    });

    // Also clear timeout if response is closed
    res.on('close', () => {
      clearTimeout(timeout);
    });

    next();
  };
};
