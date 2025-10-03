import { Router } from 'express';
import {
  createThread,
  getThreads,
  getThreadById,
  sendMessage,
  streamResponse,
  deleteThread
} from '../controllers/chatController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All chat routes require authentication
router.use(authenticateToken);

// Thread management
router.post('/threads', createThread);           // Create new chat thread
router.get('/threads', getThreads);              // List user's threads
router.get('/threads/:id', getThreadById);       // Get thread with messages
router.delete('/threads/:id', deleteThread);     // Delete thread

// Messaging
router.post('/threads/:id/messages', sendMessage);  // Send user message
router.get('/threads/:id/stream', streamResponse);  // SSE stream for AI responses

export default router;
