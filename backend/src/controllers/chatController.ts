import { Request, Response } from 'express';
import * as chatService from '../services/chatService';
import { z } from 'zod';

// Validation schemas
const createThreadSchema = z.object({
  title: z.string().optional(),
  problemId: z.string().optional().nullable(), // Link to specific problem
});

const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  problemId: z.string().optional().nullable(),
});

/**
 * Create new chat thread
 * POST /api/chat/threads
 */
export const createThread = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const data = createThreadSchema.parse(req.body);

    const thread = await chatService.createThread(userId, data);

    res.status(201).json({
      success: true,
      data: thread,
    });
  } catch (error) {
    console.error('Error creating thread:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create thread',
    });
  }
};

/**
 * Get all user's chat threads
 * GET /api/chat/threads
 */
export const getThreads = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const threads = await chatService.getUserThreads(userId);

    res.json({
      success: true,
      data: threads,
    });
  } catch (error) {
    console.error('Error fetching threads:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch threads',
    });
  }
};

/**
 * Problems available in the AI Tutor picker with their latest conversation
 * GET /api/chat/problems
 */
export const getTutorProblems = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const problems = await chatService.getTutorProblems(userId);

    res.json({
      success: true,
      data: problems,
    });
  } catch (error) {
    console.error('Error fetching tutor problems:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch problems',
    });
  }
};

/**
 * Get specific thread with messages
 * GET /api/chat/threads/:id
 */
export const getThreadById = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const thread = await chatService.getThreadWithMessages(id, userId);

    if (!thread) {
      return res.status(404).json({
        success: false,
        error: 'Thread not found',
      });
    }

    return res.json({
      success: true,
      data: thread,
    });
  } catch (error) {
    console.error('Error fetching thread:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch thread',
    });
  }
};

/**
 * Send message to thread
 * POST /api/chat/threads/:id/messages
 */
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id: threadId } = req.params;
    const data = sendMessageSchema.parse(req.body);

    // Refresh the hidden system context right before each answer so the tutor
    // sees the latest solution, hints, and concept notes for the active problem.
    if (data.problemId) {
      await chatService.syncProblemContextMessage(threadId, userId, data.problemId);
    }

    // Save user message
    const message = await chatService.addMessage(threadId, userId, {
      role: 'USER',
      content: data.content,
      metadata: data.problemId ? { problemId: data.problemId } : undefined,
    });

    // Enqueue AI response job (non-blocking)
    chatService.enqueueAIResponse(threadId, userId, data.problemId).catch((err: any) => {
      console.error('Error enqueueing AI response:', err);
    });

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message',
    });
  }
};

/**
 * Stream AI response via SSE
 * GET /api/chat/threads/:id/stream
 */
export const streamResponse = async (req: Request, res: Response) => {
  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.setHeader('Transfer-Encoding', 'chunked'); // Ensure proper streaming in production
  res.flushHeaders();

  const sendSse = (data: object) => {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      // Explicit flush to prevent buffering in production proxies
      // @ts-ignore - flush() exists on Node.js ServerResponse
      if (res.flush) res.flush();
    }
  };

  const cleanup = () => {
    if (!res.writableEnded) {
      res.end();
    }
  };

  req.on('close', () => {
    console.log('Client disconnected from SSE stream.');
    cleanup();
  });

  try {
    const userId = req.user!.id;
    const { id: threadId } = req.params;

    // Verify thread ownership
    const thread = await chatService.getThreadWithMessages(threadId, userId);
    if (!thread) {
      sendSse({ type: 'error', error: 'Thread not found' });
      return;
    }

    sendSse({ type: 'connected' });

    // Only generate AI response if the last message is from USER
    const lastMessage = thread.messages[thread.messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'USER') {
      console.log('No unanswered user message, closing stream');
      sendSse({ type: 'done' });
      cleanup();
      return;
    }

    // Stream AI response
    const result = await chatService.streamAIResponse(threadId, userId, (chunk: any) => {
      sendSse(chunk);
    });

    // End stream only on success
    if (result.success) {
      // The client-side logic uses "[DONE]" as a string, not JSON
      if (!res.writableEnded) {
        res.write('data: [DONE]\n\n');
      }
    }
  } catch (error) {
    console.error('Error streaming response:', error);
    sendSse({ type: 'error', error: 'Stream failed' });
  } finally {
    cleanup();
  }
};

/**
 * Delete thread
 * DELETE /api/chat/threads/:id
 */
export const deleteThread = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await chatService.deleteThread(id, userId);

    res.json({
      success: true,
      message: 'Thread deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting thread:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete thread',
    });
  }
};
