import { Router } from 'express';
import { healthCheck, getVersion } from '../controllers/healthController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Health check endpoints
 */

/**
 * @swagger
 * tags:
 *   name: System
 *   description: System information endpoints
 */

// Health check endpoint - no rate limiting
router.get('/health', asyncHandler(healthCheck));

// Version endpoint - no rate limiting
router.get('/version', asyncHandler(getVersion));

export default router;
