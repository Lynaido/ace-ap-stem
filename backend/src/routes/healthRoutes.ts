import { Router } from 'express';
import { healthCheck, readinessCheck, getVersion } from '../controllers/healthController';
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

// Deployment readiness endpoint - validates database connectivity
router.get('/ready', asyncHandler(readinessCheck));

// Version endpoint - no rate limiting
router.get('/version', asyncHandler(getVersion));

export default router;
