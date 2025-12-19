import nodemailer from 'nodemailer';
import config from '../config/environment';
import logger from '../config/logger';

// Initialize Nodemailer transporter
// Use Gmail service if host is gmail, otherwise use custom SMTP
const isGmail = config.smtpHost.includes('gmail');

const transporterConfig = isGmail
  ? {
      service: 'gmail',
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword,
      },
    }
  : {
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword,
      },
      tls: {
        rejectUnauthorized: false,
      },
    };

const transporter = nodemailer.createTransport(transporterConfig);

// Verify transporter on startup (only if credentials are configured)
if (config.smtpUser && config.smtpPassword) {
  transporter.verify((error: Error | null) => {
    if (error) {
      logger.warn('Email service configuration error:', error.message);
      logger.warn('SMTP Config:', {
        host: config.smtpHost,
        port: config.smtpPort,
        user: config.smtpUser ? '***configured***' : 'missing',
        isGmail
      });
    } else {
      logger.info('Email service is ready');
    }
  });
} else {
  logger.warn('Email service not configured: SMTP credentials missing');
}

export interface SendPasswordResetEmailParams {
  to: string;
  userName?: string;
  resetLink: string;
}

export const sendPasswordResetEmail = async ({
  to,
  userName,
  resetLink,
}: SendPasswordResetEmailParams): Promise<boolean> => {
  try {
    const mailOptions = {
      from: `"${config.smtpFromName}" <${config.smtpFromEmail}>`,
      to,
      subject: 'Reset Your AAS Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">AAS</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1f2937; margin-top: 0;">Password Reset Request</h2>
            <p>Hi ${userName || 'there'},</p>
            <p>We received a request to reset your password for your AAS account. Click the button below to create a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">This link will expire in ${config.passwordResetTokenExpiresHours} hour${config.passwordResetTokenExpiresHours > 1 ? 's' : ''}.</p>
            <p style="color: #6b7280; font-size: 14px;">If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetLink}" style="color: #f97316; word-break: break-all;">${resetLink}</a>
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
Password Reset Request

Hi ${userName || 'there'},

We received a request to reset your password for your AAS account.

Click the link below to create a new password:
${resetLink}

This link will expire in ${config.passwordResetTokenExpiresHours} hour${config.passwordResetTokenExpiresHours > 1 ? 's' : ''}.

If you didn't request this password reset, you can safely ignore this email.
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Password reset email sent to ${to}`);
    return true;
  } catch (error) {
    logger.error('Failed to send password reset email:', error);
    return false;
  }
};

export default {
  sendPasswordResetEmail,
};
