import { MessageRole } from '@prisma/client';
import OpenAI from 'openai';
import config from '../config/environment';
import logger from '../config/logger';
import prisma from '../lib/prisma';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openaiApiKey,
  timeout: config.openaiTimeoutMs, // Use environment config for production flexibility
  maxRetries: 2,
});

interface CreateThreadData {
  title?: string;
  problemId?: string | null;
}

interface AddMessageData {
  role: MessageRole;
  content: string;
  metadata?: any;
}

const stringifyContextValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
};

const buildProblemSystemPrompt = async (userId: string, problemId: string) => {
  const problem = await prisma.problem.findFirst({
    where: { id: problemId, userId },
    include: {
      solutions: { orderBy: { createdAt: 'desc' } },
      hints: { orderBy: { createdAt: 'desc' } },
      conceptNotes: { orderBy: { createdAt: 'desc' } },
      assets: true,
    },
  });

  if (!problem) return null;

  let systemPrompt = `This conversation is about the following AP STEM problem:
Title: ${problem.title}
Subject: ${problem.subject}
Difficulty: ${problem.difficulty}
Description: ${problem.description}
`;

  if (problem.imageUrl || problem.assets.length > 0) {
    systemPrompt += `\n--- ATTACHED PROBLEM ASSETS ---\n`;
    if (problem.imageUrl) {
      systemPrompt += `Problem image URL: ${problem.imageUrl}\n`;
    }
    problem.assets.forEach((asset, idx) => {
      systemPrompt += `Asset #${idx + 1}: ${asset.fileName} (${asset.mimeType}) ${asset.externalUrl || asset.storageLocation}\n`;
    });
  }

  if (problem.solutions.length > 0) {
    systemPrompt += `\n--- GENERATED SOLUTIONS CURRENTLY AVAILABLE ---\n`;
    problem.solutions.forEach((sol, idx) => {
      systemPrompt += `Solution #${idx + 1}:\n${sol.content}\n`;
      const steps = stringifyContextValue(sol.steps);
      if (steps) systemPrompt += `Steps:\n${steps}\n`;
      const finalAnswer = stringifyContextValue(sol.finalAnswer);
      if (finalAnswer) systemPrompt += `Final answer:\n${finalAnswer}\n`;
      if (sol.sources?.length) {
        systemPrompt += `Sources: ${sol.sources.join(', ')}\n`;
      }
    });
  }

  if (problem.hints.length > 0) {
    systemPrompt += `\n--- HINTS PROVIDED TO STUDENT ---\n`;
    problem.hints.forEach((hint, idx) => {
      systemPrompt += `Hint #${idx + 1}:\n${hint.content}\n`;
    });
  }

  if (problem.conceptNotes.length > 0) {
    systemPrompt += `\n--- CONCEPT NOTES PROVIDED TO STUDENT ---\n`;
    problem.conceptNotes.forEach((note, idx) => {
      systemPrompt += `Concept Note #${idx + 1}: ${note.title}\n${note.content}\n`;
    });
  }

  systemPrompt += `\nAs an AI tutor, help the user with this exact problem and the currently available solution, hints, and concept notes. If the user asks about a visible step, formula, or hint, ground your answer in the context above. Explain without fabricating missing details, and ask for clarification if the visible context is not enough. Keep responses concise, encouraging, and educational.`;

  return systemPrompt;
};

export const syncProblemContextMessage = async (
  threadId: string,
  userId: string,
  problemId?: string | null
) => {
  if (!problemId) return;

  const thread = await prisma.chatThread.findFirst({
    where: { id: threadId, userId },
  });

  if (!thread) {
    throw new Error('Thread not found or access denied');
  }

  const systemPrompt = await buildProblemSystemPrompt(userId, problemId);
  if (!systemPrompt) return;

  const existingSystemMessage = await prisma.message.findFirst({
    where: {
      threadId,
      role: 'SYSTEM',
    },
    orderBy: { createdAt: 'asc' },
  });

  if (existingSystemMessage) {
    await prisma.message.update({
      where: { id: existingSystemMessage.id },
      data: {
        content: systemPrompt,
        metadata: {
          problemId,
          refreshedAt: new Date().toISOString(),
          source: 'problem-context',
        },
      },
    });
  } else {
    await prisma.message.create({
      data: {
        threadId,
        role: 'SYSTEM',
        content: systemPrompt,
        metadata: {
          problemId,
          refreshedAt: new Date().toISOString(),
          source: 'problem-context',
        },
      },
    });
  }

  await prisma.chatThread.update({
    where: { id: threadId },
    data: { updatedAt: new Date() },
  });
};

/**
 * Create new chat thread
 */
export const createThread = async (userId: string, data: CreateThreadData) => {
  const thread = await prisma.chatThread.create({
    data: {
      userId,
      title: data.title || 'New Conversation',
    },
  });

  // If linked to problem, add system message with context
  if (data.problemId) {
    try {
      await syncProblemContextMessage(thread.id, userId, data.problemId);
    } catch (error) {
      console.error('Error adding system message:', error);
      // Continue even if system message fails
    }
  }

  return thread;
};

/**
 * Get all threads for user
 */
export const getUserThreads = async (userId: string) => {
  return prisma.chatThread.findMany({
    where: { userId },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1, // Include last message preview
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
};

/**
 * Get thread with all messages
 */
export const getThreadWithMessages = async (threadId: string, userId: string) => {
  return prisma.chatThread.findFirst({
    where: { id: threadId, userId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
};

/**
 * Add message to thread
 */
export const addMessage = async (
  threadId: string,
  userId: string,
  data: AddMessageData
) => {
  // Verify thread ownership
  const thread = await prisma.chatThread.findFirst({
    where: { id: threadId, userId },
  });

  if (!thread) {
    throw new Error('Thread not found or access denied');
  }

  const message = await prisma.message.create({
    data: {
      threadId,
      role: data.role,
      content: data.content,
      metadata: data.metadata || {},
    },
  });

  // Update thread timestamp
  await prisma.chatThread.update({
    where: { id: threadId },
    data: { updatedAt: new Date() },
  });

  return message;
};

/**
 * Enqueue AI response generation
 * Currently processes immediately, will use BullMQ in future for scalability
 */
export const enqueueAIResponse = async (
  threadId: string,
  userId: string,
  problemId?: string | null
) => {
  logger.info('AI response generation queued', { threadId, userId, problemId });
  
  // For now, we process immediately
  // In production, this would create a BullMQ job
  return {
    id: `job-${Date.now()}`,
    threadId,
    userId,
    problemId,
    status: 'processing',
  };
};

/**
 * Select appropriate model based on conversation context
 */
const selectChatModel = (messageCount: number, avgLength: number): string => {
  // Simple greetings and short questions
  if (messageCount <= 2 && avgLength < 100) {
    return 'gpt-4o-mini'; // Fast, cost-effective
  }

  // Standard conversations
  if (messageCount <= 10) {
    return 'gpt-4o-mini'; // Balanced
  }

  // Complex, multi-turn discussions
  return 'gpt-4o'; // Most capable
};

/**
 * Build context messages with token management
 */
const buildChatContext = (messages: any[], maxTokens = 4000): any[] => {
  const context: any[] = [];
  let totalTokens = 0;

  // Always include system message if present
  const systemMsg = messages.find((m) => m.role === 'SYSTEM');
  if (systemMsg) {
    context.push({
      role: 'system',
      content: systemMsg.content,
    });
    totalTokens += Math.ceil(systemMsg.content.length / 4); // Rough token estimate
  }

  // Add messages from most recent, working backwards
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === 'SYSTEM') continue; // Already added

    const tokens = Math.ceil(msg.content.length / 4);
    if (totalTokens + tokens > maxTokens) break;

    const role = msg.role.toLowerCase();
    context.unshift({
      role: role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    });
    totalTokens += tokens;
  }

  // Add system prompt if not already present
  if (!systemMsg) {
    context.unshift({
      role: 'system',
      content: `You are an expert AI tutor for AP STEM subjects (Calculus, Physics, Chemistry, Biology, Statistics). You help students understand concepts through:
- Clear, step-by-step explanations
- Socratic questioning to guide discovery
- Encouraging words and positive reinforcement
- Breaking down complex problems into manageable parts

Always be patient, supportive, and educational. Never give direct answers without explanation. Guide students to discover solutions themselves through thoughtful questions and hints.

Keep each response brief and to the point. Aim for 1-2 short paragraphs.`,
    });
  }

  return context;
};

/**
 * Stream AI response using OpenAI
 */
export const streamAIResponse = async (
  threadId: string,
  userId: string,
  onChunk: (chunk: any) => void
): Promise<{ success: boolean }> => {
  let fullResponse = '';
  let selectedModel = 'gpt-4o-mini';

  try {
    // Check if API key is configured
    if (!config.openaiApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    // Get conversation history
    const thread = await getThreadWithMessages(threadId, userId);
    if (!thread) throw new Error('Thread not found');

    logger.info('Starting AI response stream', { threadId, messageCount: thread.messages.length });

    // Calculate average message length and select model
    const avgLength =
      thread.messages.reduce((sum, msg) => sum + msg.content.length, 0) /
      Math.max(thread.messages.length, 1);
    selectedModel = selectChatModel(thread.messages.length, avgLength);

    logger.info('Model selected for chat', { 
      model: selectedModel, 
      messageCount: thread.messages.length, 
      avgLength 
    });

    // Build context messages
    const contextMessages = buildChatContext(thread.messages);

    // Stream from OpenAI
    const stream = await openai.chat.completions.create({
      model: selectedModel,
      messages: contextMessages,
      stream: true,
      temperature: 0.6,
      max_tokens: 800, // Increased from 150 for better tutoring responses
    });

    // Process stream chunks
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        onChunk({
          type: 'chunk',
          content,
        });
      }
    }

    logger.info('AI response stream completed', { 
      threadId, 
      responseLength: fullResponse.length,
      model: selectedModel 
    });

    // Save complete response to database
    await addMessage(threadId, userId, {
      role: 'ASSISTANT',
      content: fullResponse,
      metadata: {
        model: selectedModel,
        tokens: Math.ceil(fullResponse.length / 4), // Approximate
        streamCompleted: true,
        timestamp: new Date().toISOString(),
      },
    });

    onChunk({ type: 'done' });
    return { success: true };
  } catch (error) {
    logger.error('Error streaming AI response:', error);
    
    // Provide helpful error messages
    let errorMessage = 'Failed to generate response';
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'AI service is not configured properly';
      } else if (error.message.includes('quota')) {
        errorMessage = 'AI service quota exceeded';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Too many requests. Please wait a moment';
      } else {
        errorMessage = error.message;
      }
    }

    onChunk({
      type: 'error',
      error: errorMessage,
    });

    // Try to save error message to database
    try {
      if (fullResponse.length > 0) {
        await addMessage(threadId, userId, {
          role: 'ASSISTANT',
          content: fullResponse + '\n\n[Response was interrupted]',
          metadata: {
            model: selectedModel,
            streamCompleted: false,
            error: errorMessage,
          },
        });
      }
    } catch (dbError) {
      logger.error('Failed to save partial response:', dbError);
    }
    return { success: false };
  }
};

/**
 * Delete thread
 */
export const deleteThread = async (threadId: string, userId: string) => {
  const thread = await prisma.chatThread.findFirst({
    where: { id: threadId, userId },
  });

  if (!thread) {
    throw new Error('Thread not found or access denied');
  }

  await prisma.chatThread.delete({
    where: { id: threadId },
  });
};
