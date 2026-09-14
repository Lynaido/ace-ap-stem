import { Router } from 'express';
import {
  getCompanionProfile,
  updateCompanionProfile
} from '../controllers/companionController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Acey profiles are private to each learner
router.use(authenticateToken);

/**
 * @swagger
 * /api/companion:
 *   get:
 *     summary: Get the Acey companion profile
 *     description: Retrieve the learner's saved Acey appearance, preferences and onboarding progress
 *     tags: [Companion]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Companion profile (defaults are empty objects)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', getCompanionProfile);

/**
 * @swagger
 * /api/companion:
 *   put:
 *     summary: Update the Acey companion profile
 *     description: Merge appearance, preferences or onboarding progress; omitted sections are kept
 *     tags: [Companion]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               appearance:
 *                 type: object
 *                 properties:
 *                   outfitId: { type: string, example: 'classic' }
 *                   moodId: { type: string, example: 'cheerful' }
 *                   accessoriesEnabled: { type: boolean }
 *               preferences:
 *                 type: object
 *                 properties:
 *                   minimized: { type: boolean }
 *                   bubblesEnabled: { type: boolean }
 *               onboarding:
 *                 type: object
 *                 properties:
 *                   status: { type: string, enum: [completed, skipped, dismissed] }
 *     responses:
 *       200:
 *         description: Updated companion profile
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/', updateCompanionProfile);

export default router;
