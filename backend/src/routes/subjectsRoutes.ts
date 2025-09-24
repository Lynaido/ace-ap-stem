import { Router } from 'express';
import { getAllSubjects, getSubjectById } from '../controllers/subjectsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All subject routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/subjects:
 *   get:
 *     summary: Get all available AP subjects
 *     description: Retrieve all available AP subjects with their categories and topics
 *     tags: [Subjects]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all AP subjects
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
 *                     $ref: '#/components/schemas/Subject'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', getAllSubjects);

/**
 * @swagger
 * /api/subjects/{id}:
 *   get:
 *     summary: Get a specific AP subject by ID
 *     description: Retrieve details of a specific AP subject including its categories
 *     tags: [Subjects]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subject ID (e.g., 'ap_physics_1_2', 'ap_chemistry')
 *     responses:
 *       200:
 *         description: Subject details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Subject'
 *       404:
 *         description: Subject not found
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
router.get('/:id', getSubjectById);

export default router;
