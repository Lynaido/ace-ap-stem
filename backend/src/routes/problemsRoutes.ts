import { Router } from 'express';
import {
  getAllProblems,
  getProblemById,
  createProblem,
  updateProblem,
  deleteProblem,
  associateAssetsWithProblem
} from '../controllers/problemsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All problem routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/problems:
 *   get:
 *     summary: Get all problems for the authenticated user
 *     description: Retrieve all problems for the current user with optional filtering and pagination
 *     tags: [Problems]
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
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *           enum: [ap_physics_1_2, ap_physics_c_mechanics, ap_physics_c_electricity_magnetism, ap_chemistry, ap_biology, ap_computer_science_a, ap_computer_science_principles, ap_precalculus, ap_calculus_bc, ap_calculus_ab, ap_statistics]
 *         description: Filter by AP subject
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard]
 *         description: Filter by difficulty level
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [RECEIVED, QUEUED, SOLVED]
 *         description: Filter by problem status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *     responses:
 *       200:
 *         description: List of problems with pagination
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
 *                     $ref: '#/components/schemas/Problem'
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
router.get('/', getAllProblems);

/**
 * @swagger
 * /api/problems/{id}:
 *   get:
 *     summary: Get a specific problem by ID
 *     description: Retrieve a specific problem with all its details including assets and related data
 *     tags: [Problems]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Problem ID
 *     responses:
 *       200:
 *         description: Problem details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Problem'
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
router.get('/:id', getProblemById);

/**
 * @swagger
 * /api/problems:
 *   post:
 *     summary: Create a new problem
 *     description: Create a new problem for the authenticated user
 *     tags: [Problems]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - subject
 *             properties:
 *               title:
 *                 type: string
 *                 example: 'Solve for the velocity of the object'
 *               description:
 *                 type: string
 *                 example: 'A 2kg object is dropped from 10m height. Calculate its velocity when it hits the ground.'
 *               subject:
 *                 type: string
 *                 enum: [ap_physics_1_2, ap_physics_c_mechanics, ap_physics_c_electricity_magnetism, ap_chemistry, ap_biology, ap_computer_science_a, ap_computer_science_principles, ap_precalculus, ap_calculus_bc, ap_calculus_ab, ap_statistics]
 *                 example: 'ap_physics_1_2'
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *                 example: 'medium'
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *                 example: 'https://example.com/image.png'
 *     responses:
 *       201:
 *         description: Problem created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Problem'
 *                 message:
 *                   type: string
 *                   example: 'Problem created successfully'
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
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', createProblem);

/**
 * @swagger
 * /api/problems/{id}:
 *   put:
 *     summary: Update a problem
 *     description: Update an existing problem
 *     tags: [Problems]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Problem ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: 'Updated problem title'
 *               description:
 *                 type: string
 *                 example: 'Updated problem description'
 *               subject:
 *                 type: string
 *                 enum: [ap_physics_1_2, ap_physics_c_mechanics, ap_physics_c_electricity_magnetism, ap_chemistry, ap_biology, ap_computer_science_a, ap_computer_science_principles, ap_precalculus, ap_calculus_bc, ap_calculus_ab, ap_statistics]
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *               status:
 *                 type: string
 *                 enum: [RECEIVED, QUEUED, SOLVED]
 *     responses:
 *       200:
 *         description: Problem updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Problem'
 *                 message:
 *                   type: string
 *                   example: 'Problem updated successfully'
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
router.put('/:id', updateProblem);

/**
 * @swagger
 * /api/problems/{id}:
 *   delete:
 *     summary: Delete a problem
 *     description: Delete a problem and all its associated data
 *     tags: [Problems]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Problem ID
 *     responses:
 *       200:
 *         description: Problem deleted successfully
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
 *                   example: 'Problem deleted successfully'
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
router.delete('/:id', deleteProblem);

/**
 * @swagger
 * /api/problems/{id}/assets:
 *   post:
 *     summary: Associate uploaded assets with a problem
 *     description: Link previously uploaded assets to a specific problem
 *     tags: [Problems]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Problem ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assetIds
 *             properties:
 *               assetIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 example: ['asset-id-1', 'asset-id-2']
 *     responses:
 *       200:
 *         description: Assets associated successfully
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
 *                     $ref: '#/components/schemas/ProblemAsset'
 *                 message:
 *                   type: string
 *                   example: 'Assets associated with problem successfully'
 *       400:
 *         description: Invalid asset IDs array
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
router.post('/:id/assets', associateAssetsWithProblem);

export default router;
