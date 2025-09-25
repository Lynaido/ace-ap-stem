import { Router } from 'express';
import {
  getAllSavedItems,
  getSavedItemById,
  createSavedItem,
  updateSavedItem,
  deleteSavedItem
} from '../controllers/savedItemsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All saved item routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/saved-items:
 *   get:
 *     summary: Get all saved items for the authenticated user
 *     description: Retrieve all saved items with optional filtering
 *     tags: [Saved Items]
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [PROBLEM, SOLUTION, HINT, CONCEPT_NOTE]
 *         description: Filter by item type
 *       - in: query
 *         name: starred
 *         schema:
 *           type: boolean
 *         description: Filter by starred status
 *       - in: query
 *         name: tags
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by tags
 *     responses:
 *       200:
 *         description: List of saved items with pagination
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
 *                     $ref: '#/components/schemas/SavedItem'
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
router.get('/', getAllSavedItems);

/**
 * @swagger
 * /api/saved-items/{id}:
 *   get:
 *     summary: Get a specific saved item by ID
 *     description: Retrieve a saved item with all related data
 *     tags: [Saved Items]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Saved item ID
 *     responses:
 *       200:
 *         description: Saved item details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SavedItem'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Saved item not found
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
router.get('/:id', getSavedItemById);

/**
 * @swagger
 * /api/saved-items:
 *   post:
 *     summary: Create a new saved item
 *     description: Save a problem, solution, hint, or concept note for later reference
 *     tags: [Saved Items]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [PROBLEM, SOLUTION, HINT, CONCEPT_NOTE]
 *                 example: 'PROBLEM'
 *               problemId:
 *                 type: string
 *                 format: uuid
 *                 example: 'problem-id-123'
 *               solutionId:
 *                 type: string
 *                 format: uuid
 *                 example: 'solution-id-456'
 *               hintId:
 *                 type: string
 *                 format: uuid
 *                 example: 'hint-id-789'
 *               conceptNoteId:
 *                 type: string
 *                 format: uuid
 *                 example: 'concept-note-id-101'
 *               starred:
 *                 type: boolean
 *                 default: false
 *                 example: true
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ['calculus', 'integration']
 *     responses:
 *       201:
 *         description: Saved item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SavedItem'
 *                 message:
 *                   type: string
 *                   example: 'Item saved successfully'
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
 *       403:
 *         description: Cannot save item from another user's problem
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Referenced item not found
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
router.post('/', createSavedItem);

/**
 * @swagger
 * /api/saved-items/{id}:
 *   put:
 *     summary: Update a saved item
 *     description: Update starred status and tags
 *     tags: [Saved Items]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Saved item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               starred:
 *                 type: boolean
 *                 example: true
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ['calculus', 'integration', 'difficult']
 *     responses:
 *       200:
 *         description: Saved item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SavedItem'
 *                 message:
 *                   type: string
 *                   example: 'Saved item updated successfully'
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
 *         description: Saved item not found
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
router.put('/:id', updateSavedItem);

/**
 * @swagger
 * /api/saved-items/{id}:
 *   delete:
 *     summary: Delete a saved item
 *     description: Remove a saved item from bookmarks
 *     tags: [Saved Items]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Saved item ID
 *     responses:
 *       200:
 *         description: Saved item deleted successfully
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
 *                   example: 'Saved item deleted successfully'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Saved item not found
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
router.delete('/:id', deleteSavedItem);

export default router;

