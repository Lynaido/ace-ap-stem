import { Request, Response } from 'express';
import logger from '../config/logger';
import config from '../config/environment';
import prisma from '../lib/prisma';

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API server
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: healthy
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     version:
 *                       type: string
 *                       example: 1.0.0
 *                     environment:
 *                       type: string
 *                       example: development
 */
export const healthCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: config.nodeEnv,
      uptime: process.uptime(),
    };

    logger.info('Health check requested', healthData);

    res.status(200).json({
      success: true,
      data: healthData,
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(500).json({
      success: false,
      error: {
        message: 'Health check failed',
      },
    });
  }
};

/**
 * Readiness check used by Railway before routing traffic to a deployment.
 * It verifies that the API process can reach its primary database.
 */
export const readinessCheck = async (req: Request, res: Response): Promise<void> => {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      data: {
        status: 'ready',
        database: 'reachable',
        responseTimeMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Readiness check failed', { error });
    res.status(503).json({
      success: false,
      error: {
        message: 'Service is not ready',
        database: 'unreachable',
      },
    });
  }
};

/**
 * @swagger
 * /version:
 *   get:
 *     summary: Version endpoint
 *     description: Returns the API version and build information
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Version information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     version:
 *                       type: string
 *                       example: 1.0.0
 *                     build:
 *                       type: string
 *                       example: abc123
 *                     commit:
 *                       type: string
 *                       example: a1b2c3d4
 */
export const getVersion = async (req: Request, res: Response): Promise<void> => {
  try {
    const versionData = {
      version: '1.0.0',
      build: process.env.BUILD_NUMBER || 'dev',
      commit: process.env.GIT_COMMIT || 'unknown',
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    };

    logger.info('Version info requested', versionData);

    res.status(200).json({
      success: true,
      data: versionData,
    });
  } catch (error) {
    logger.error('Version check failed', { error });
    res.status(500).json({
      success: false,
      error: {
        message: 'Version check failed',
      },
    });
  }
};
