import { Request, Response } from 'express';
import emailService from '../services/emailService';
import logger from '../config/logger';

/**
 * @swagger
 * /api/contact:
 *   post:
 *     summary: Submit contact form
 *     description: Validates contact details and sends an email to aceapstem@gmail.com
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
export const submitContactForm = async (req: Request, res: Response): Promise<void> => {
  const { name, email, subject, message } = req.body;

  // Simple validation
  if (!name || !email || !message) {
    res.status(400).json({
      success: false,
      error: 'Please fill in all required fields (Name, Email, Message)',
    });
    return;
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({
      success: false,
      error: 'Please enter a valid email address',
    });
    return;
  }

  try {
    const success = await emailService.sendContactEmail({
      name,
      email,
      subject: subject || 'No Subject',
      message,
    });

    if (success) {
      res.status(200).json({
        success: true,
        message: 'Your message has been sent successfully!',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send message. Please try again later.',
      });
    }
  } catch (error) {
    logger.error('Error handling contact form submission:', error);
    res.status(500).json({
      success: false,
      error: 'An internal server error occurred. Please try again later.',
    });
  }
};
