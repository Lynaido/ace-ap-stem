import { Router } from 'express';
import {
  getAllStudySessions,
  getStudySessionById,
  createStudySession,
  updateStudySession,
  deleteStudySession,
  generateVariants
} from '../controllers/studySessionsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All study session routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/study-sessions:
 *   get:
 *     summary: Get all study sessions for the authenticated user
 *     description: Retrieve all study sessions with optional filtering
 *     tags: [Study Sessions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: problemId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by problem
 *     responses:
 *       200:
 *         description: List of study sessions with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StudySession'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', getAllStudySessions);

/**
 * @swagger
 * /api/study-sessions/{id}:
 *   get:
 *     summary: Get a specific study session by ID
 *     description: Retrieve a study session with problem details
 *     tags: [Study Sessions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Study session ID
 *     responses:
 *       200:
 *         description: Study session details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/StudySession'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Study session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getStudySessionById);

/**
 * @swagger
 * /api/study-sessions:
 *   post:
 *     summary: Create a new study session
 *     description: Create a study session for practicing a problem
 *     tags: [Study Sessions]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - problemId
 *             properties:
 *               problemId:
 *                 type: string
 *                 format: uuid
 *                 example: 'problem-id-123'
 *               metadata:
 *                 type: object
 *                 properties:
 *                   difficulty:
 *                     type: string
 *                     example: 'medium'
 *                   estimatedTime:
 *                     type: number
 *                     example: 30
 *                   notes:
 *                     type: string
 *                     example: 'Focus on integration techniques'
 *     responses:
 *       201:
 *         description: Study session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/StudySession'
 *                 message:
 *                   type: string
 *                   example: 'Study session created successfully'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Problem not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', createStudySession);

/**
 * @swagger
 * /api/study-sessions/{id}:
 *   put:
 *     summary: Update a study session
 *     description: Update study session metadata and tracking
 *     tags: [Study Sessions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Study session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               metadata:
 *                 type: object
 *                 properties:
 *                   difficulty:
 *                     type: string
 *                     example: 'hard'
 *                   estimatedTime:
 *                     type: number
 *                     example: 45
 *                   notes:
 *                     type: string
 *                     example: 'Completed with help from hints'
 *                   actualTime:
 *                     type: number
 *                     example: 38
 *                   completed:
 *                     type: boolean
 *                     example: true
 *     responses:
 *       200:
 *         description: Study session updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/StudySession'
 *                 message:
 *                   type: string
 *                   example: 'Study session updated successfully'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Study session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', updateStudySession);

/**
 * @swagger
 * /api/study-sessions/{id}:
 *   delete:
 *     summary: Delete a study session
 *     description: Delete a study session permanently
 *     tags: [Study Sessions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Study session ID
 *     responses:
 *       200:
 *         description: Study session deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Study session deleted successfully'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Study session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', deleteStudySession);

/**
 * @swagger
 * /api/study-sessions/{id}/variants:
 *   post:
 *     summary: Generate AI-powered problem variants for a study session
 *     description: Create personalized practice problem variants based on the original problem and study mode
 *     tags: [Study Sessions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Study session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studyMode
 *             properties:
 *               studyMode:
 *                 type: string
 *                 example: 'Practice Mode'
 *                 description: The study mode for variant generation
 *               variantCount:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 default: 3
 *                 example: 3
 *                 description: Number of variants to generate
 *     responses:
 *       200:
 *         description: Variants generated successfully
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
 *                     studySession:
 *                       $ref: '#/components/schemas/StudySession'
 *                     variants:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: 'variant-1'
 *                           title:
 *                             type: string
 *                             example: 'Practice Variant: Force Analysis'
 *                           description:
 *                             type: string
 *                             example: 'A 5kg block slides down a 30° incline...'
 *                           difficulty:
 *                             type: string
 *                             example: 'medium'
 *                           estimatedTime:
 *                             type: number
 *                             example: 12
 *                           hints:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ['Start with a force diagram', 'Consider friction']
 *                 message:
 *                   type: string
 *                   example: 'Generated 3 practice variants successfully'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Study session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/variants', generateVariants);

export default router;

