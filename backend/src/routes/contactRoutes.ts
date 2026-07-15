import { Router } from 'express';
import { submitContactForm } from '../controllers/contactController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Contact
 *   description: Contact form endpoints
 */

// POST /api/contact - Submit contact form
router.post('/', asyncHandler(submitContactForm));

export default router;
