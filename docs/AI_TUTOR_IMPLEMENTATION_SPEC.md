# AI Tutor Chat - Implementation Specification

**Status:** Ready for Implementation (Phase 6)  
**Priority:** High  
**Owner:** Full-Stack Team  
**Last Updated:** January 3, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Current State Analysis](#current-state-analysis)
3. [Architecture Design](#architecture-design)
4. [Database Schema](#database-schema)
5. [Backend Implementation](#backend-implementation)
6. [Frontend Integration](#frontend-integration)
7. [AI Integration Strategy](#ai-integration-strategy)
8. [User Experience Flow](#user-experience-flow)
9. [Implementation Phases](#implementation-phases)
10. [Testing Strategy](#testing-strategy)
11. [Security & Performance Considerations](#security--performance-considerations)

---

## 1. Overview

The AI Tutor Chat feature provides an interactive, conversational interface where students can:
- Ask follow-up questions about problems and solutions
- Get step-by-step explanations and clarifications
- Receive hints without revealing full solutions
- Explore related concepts and alternative approaches
- Have persistent chat history tied to specific problems or general topics

### Key Requirements

- **Real-time streaming responses** using Server-Sent Events (SSE)
- **Context-aware conversations** that remember problem context
- **Persistent chat history** that can be saved and revisited
- **Multi-turn conversations** with proper context management
- **Graceful fallbacks** for network issues (long-polling if SSE unavailable)
- **Rate limiting** to prevent abuse
- **Moderation filters** to ensure appropriate content

---

## 2. Current State Analysis

### Frontend (Already Exists)

✅ **ChatPanel Component** (`src/components/chat/ChatPanel.js`)
- Basic UI with message display and input
- Mock AI responses with 1-second delay
- Auto-scroll to bottom
- Clean, modern design with proper styling

✅ **TutorPage** (`src/pages/TutorPage.js`)
- Dedicated full-screen chat page
- Initial greeting message
- Uses ChatPanel component

✅ **AppContext** (`src/context/AppContext.js`)
- Chat state management structure
- `chatHistory` array for messages
- `isChatOpen` toggle state
- Actions: `addChatMessage`, `clearChat`, `toggleChat`

### Backend (Missing - Needs Implementation)

❌ **No chat routes** - Need to create chat endpoints
❌ **No chat controller** - Need to implement chat logic
❌ **No chat service** - Need to implement AI integration
❌ **No SSE support** - Need to implement streaming

✅ **Database Schema Exists** - ChatThread and Message models defined

---

## 3. Architecture Design

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  ChatPanel Component                                             │
│  ├─ Message Display (with streaming)                            │
│  ├─ Input Form                                                   │
│  └─ EventSource for SSE                                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP/SSE
┌──────────────────────────▼──────────────────────────────────────┐
│                    Backend API (Express)                         │
├─────────────────────────────────────────────────────────────────┤
│  Chat Routes                                                     │
│  ├─ POST /api/chat/threads         (Create thread)              │
│  ├─ GET  /api/chat/threads         (List threads)               │
│  ├─ GET  /api/chat/threads/:id     (Get thread details)         │
│  ├─ POST /api/chat/threads/:id/messages  (Send message)         │
│  └─ GET  /api/chat/threads/:id/stream    (SSE endpoint)         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                      Chat Service                                │
├─────────────────────────────────────────────────────────────────┤
│  ├─ Thread Management                                            │
│  ├─ Message Persistence                                          │
│  ├─ Context Assembly                                             │
│  └─ AI Integration                                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                     AI Service (GPT-5)                           │
├─────────────────────────────────────────────────────────────────┤
│  ├─ Model Router (Mini/Nano/Flagship)                           │
│  ├─ Streaming Response Handler                                  │
│  ├─ Context Window Management                                   │
│  ├─ Moderation Filter                                           │
│  └─ Token Usage Tracking                                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                   Database (PostgreSQL)                          │
├─────────────────────────────────────────────────────────────────┤
│  ├─ chat_threads (conversation metadata)                        │
│  ├─ messages (conversation history)                             │
│  ├─ problems (referenced context)                               │
│  └─ ai_jobs (job tracking)                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

**1. User Sends Message:**
```
User types message → ChatPanel → POST /api/chat/threads/:id/messages
→ Validate & Save to DB → Enqueue AI job → Return message ID
```

**2. AI Generates Response (Streaming):**
```
BullMQ Worker → GPT-5 API (streaming) → SSE /api/chat/threads/:id/stream
→ ChatPanel EventSource → Display chunks in real-time → Save complete response to DB
```

**3. Load Chat History:**
```
User opens chat → GET /api/chat/threads/:id → Fetch messages from DB
→ Display in ChatPanel
```

---

## 4. Database Schema

### Existing Schema (Already Defined in Prisma)

```prisma
model ChatThread {
  id        String   @id @default(cuid())
  userId    String
  title     String?  // Auto-generated from first message
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user     User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages Message[]

  @@map("chat_threads")
}

model Message {
  id         String      @id @default(cuid())
  threadId   String
  role       MessageRole // USER, ASSISTANT, SYSTEM
  content    String
  metadata   Json?       // { problemId?, tokens?, model?, confidence? }
  createdAt  DateTime    @default(now())

  thread ChatThread @relation(fields: [threadId], references: [id], onDelete: Cascade)

  @@map("messages")
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}
```

### Additional Considerations

**Metadata JSON Structure:**
```json
{
  "problemId": "clx123...",        // If chat is about a specific problem
  "model": "gpt-5-mini",            // Which model was used
  "tokens": 256,                     // Token count
  "confidence": 0.92,                // AI confidence score
  "streamCompleted": true,           // Whether stream finished successfully
  "sources": ["section 3.2"],       // Referenced sources
  "referencedMessages": ["msg1"]    // Context messages used
}
```

---

## 5. Backend Implementation

### 5.1 Chat Routes (`backend/src/routes/chatRoutes.ts`)

```typescript
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
```

### 5.2 Chat Controller (`backend/src/controllers/chatController.ts`)

```typescript
import { Request, Response } from 'express';
import * as chatService from '../services/chatService';
import { z } from 'zod';

// Validation schemas
const createThreadSchema = z.object({
  title: z.string().optional(),
  problemId: z.string().optional(), // Link to specific problem
});

const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  problemId: z.string().optional(),
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

    res.json({
      success: true,
      data: thread,
    });
  } catch (error) {
    console.error('Error fetching thread:', error);
    res.status(500).json({
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

    // Save user message
    const message = await chatService.addMessage(threadId, userId, {
      role: 'USER',
      content: data.content,
      metadata: data.problemId ? { problemId: data.problemId } : undefined,
    });

    // Enqueue AI response job
    await chatService.enqueueAIResponse(threadId, userId, data.problemId);

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
  try {
    const userId = req.user!.id;
    const { id: threadId } = req.params;

    // Verify thread ownership
    const thread = await chatService.getThreadWithMessages(threadId, userId);
    if (!thread) {
      return res.status(404).json({
        success: false,
        error: 'Thread not found',
      });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Stream AI response
    await chatService.streamAIResponse(threadId, userId, (chunk) => {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    });

    // End stream
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Error streaming response:', error);
    res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
    res.end();
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
```

### 5.3 Chat Service (`backend/src/services/chatService.ts`)

```typescript
import { prisma } from '../config/database';
import { openaiService } from './openaiService';
import { queueService } from './queueService';

interface CreateThreadData {
  title?: string;
  problemId?: string;
}

interface AddMessageData {
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  metadata?: any;
}

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
    const problem = await prisma.problem.findUnique({
      where: { id: data.problemId },
    });

    if (problem) {
      await addMessage(thread.id, userId, {
        role: 'SYSTEM',
        content: `This conversation is about: ${problem.title}\n${problem.description}`,
        metadata: { problemId: data.problemId },
      });
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
      metadata: data.metadata,
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
 */
export const enqueueAIResponse = async (
  threadId: string,
  userId: string,
  problemId?: string
) => {
  const job = await queueService.addJob('chat-response', {
    threadId,
    userId,
    problemId,
  });

  return job;
};

/**
 * Stream AI response (called by worker)
 */
export const streamAIResponse = async (
  threadId: string,
  userId: string,
  onChunk: (chunk: any) => void
) => {
  try {
    // Get conversation history
    const thread = await getThreadWithMessages(threadId, userId);
    if (!thread) throw new Error('Thread not found');

    // Build context
    const messages = thread.messages.map((msg) => ({
      role: msg.role.toLowerCase(),
      content: msg.content,
    }));

    // Add system prompt
    const systemPrompt = {
      role: 'system',
      content: `You are an expert AI tutor for AP STEM subjects. You help students understand concepts through clear explanations, step-by-step guidance, and thoughtful questions. Always be encouraging, patient, and educational.`,
    };

    const contextMessages = [systemPrompt, ...messages];

    // Stream from OpenAI
    let fullResponse = '';
    const stream = await openaiService.streamChatCompletion(contextMessages);

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

    // Save complete response to database
    await addMessage(threadId, userId, {
      role: 'ASSISTANT',
      content: fullResponse,
      metadata: {
        model: 'gpt-5-mini',
        tokens: fullResponse.length, // Approximate
        streamCompleted: true,
      },
    });

    onChunk({ type: 'done' });
  } catch (error) {
    console.error('Error streaming AI response:', error);
    onChunk({
      type: 'error',
      error: 'Failed to generate response',
    });
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
```

### 5.4 OpenAI Service Updates (`backend/src/services/openaiService.ts`)

```typescript
// Add streaming support to existing OpenAI service

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Stream chat completion
 */
export const streamChatCompletion = async (messages: any[]) => {
  const stream = await openai.chat.completions.create({
    model: 'gpt-4', // Use appropriate model
    messages,
    stream: true,
    temperature: 0.7,
    max_tokens: 1000,
  });

  return stream;
};
```

---

## 6. Frontend Integration

### 6.1 API Helper Functions (`src/utils/api.js`)

```javascript
// Add chat API functions to existing api.js

export const chatAPI = {
  // Create new thread
  createThread: async (data = {}) => {
    const response = await fetch(`${API_BASE_URL}/chat/threads`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Get all threads
  getThreads: async () => {
    const response = await fetch(`${API_BASE_URL}/chat/threads`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  // Get specific thread
  getThread: async (threadId) => {
    const response = await fetch(`${API_BASE_URL}/chat/threads/${threadId}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  // Send message
  sendMessage: async (threadId, content, problemId = null) => {
    const response = await fetch(
      `${API_BASE_URL}/chat/threads/${threadId}/messages`,
      {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ content, problemId }),
      }
    );
    return handleResponse(response);
  },

  // Delete thread
  deleteThread: async (threadId) => {
    const response = await fetch(`${API_BASE_URL}/chat/threads/${threadId}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  // Get SSE stream URL
  getStreamUrl: (threadId) => {
    const token = localStorage.getItem('accessToken');
    return `${API_BASE_URL}/chat/threads/${threadId}/stream?token=${token}`;
  },
};
```

### 6.2 Updated ChatPanel Component

```javascript
import React, { useState, useRef, useEffect } from 'react';
import Button from '../primitives/Button';
import Input from '../primitives/Input';
import { chatAPI } from '../../utils/api';
import { useAppContext } from '../../context/AppContext';
import './ChatPanel.css';

const ChatPanel = ({ threadId = null, problemId = null, className = '' }) => {
  const { user } = useAppContext();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [currentThreadId, setCurrentThreadId] = useState(threadId);
  const messagesEndRef = useRef(null);
  const eventSourceRef = useRef(null);

  const panelClassName = ['chat-panel', className].filter(Boolean).join(' ');
  const initialRenderRef = useRef(true);

  const scrollToBottom = () => {
    const node = messagesEndRef.current;
    if (!node) return;
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      node.scrollIntoView({ behavior: 'instant', block: 'end' });
      return;
    }
    node.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // Load thread messages on mount
  useEffect(() => {
    const loadThread = async () => {
      if (!currentThreadId || !user) return;

      try {
        const response = await chatAPI.getThread(currentThreadId);
        setMessages(response.data.messages);
      } catch (error) {
        console.error('Error loading thread:', error);
      }
    };

    loadThread();
  }, [currentThreadId, user]);

  // Set up SSE listener
  useEffect(() => {
    if (!currentThreadId || !user) return;

    const streamUrl = chatAPI.getStreamUrl(currentThreadId);
    const eventSource = new EventSource(streamUrl);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      if (event.data === '[DONE]') {
        setIsStreaming(false);
        // Add complete message to history
        if (streamingMessage) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'ASSISTANT',
              content: streamingMessage,
              createdAt: new Date(),
            },
          ]);
          setStreamingMessage('');
        }
        return;
      }

      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chunk') {
          setIsStreaming(true);
          setStreamingMessage((prev) => prev + data.content);
        } else if (data.type === 'error') {
          console.error('Stream error:', data.error);
          setIsStreaming(false);
        }
      } catch (err) {
        console.error('Error parsing SSE data:', err);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
      setIsStreaming(false);
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [currentThreadId, user, streamingMessage]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (inputValue.trim() === '' || isLoading || !user) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'USER',
      content: inputValue,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Create thread if needed
      let activeThreadId = currentThreadId;
      if (!activeThreadId) {
        const threadResponse = await chatAPI.createThread({ problemId });
        activeThreadId = threadResponse.data.id;
        setCurrentThreadId(activeThreadId);
      }

      // Send message
      await chatAPI.sendMessage(activeThreadId, userMessage.content, problemId);

      // Response will come via SSE
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'ASSISTANT',
          content: 'Sorry, I encountered an error. Please try again.',
          createdAt: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={panelClassName}>
      <div className="chat-header">
        <div className="chat-title-group">
          <h3>AI Tutor</h3>
          <span className="chat-subtitle">
            Conversational guidance for every step
          </span>
        </div>
      </div>
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role.toLowerCase()}`}>
            <div className="message-content">
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
        {isStreaming && streamingMessage && (
          <div className="message assistant streaming">
            <div className="message-content">
              <p>{streamingMessage}</p>
              <span className="typing-indicator">▊</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-area">
        <form onSubmit={handleSendMessage} className="chat-form">
          <div className="chat-input-shell">
            <Input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a follow-up question..."
              className="chat-input"
              disabled={isLoading || !user}
            />
            <Button
              type="submit"
              variant="primary"
              className="send-button"
              disabled={isLoading || !user}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;
```

### 6.3 AppContext Updates

```javascript
// Add to AppContext.js

// In initial state
chatThreads: [],
activeThreadId: null,

// Action types
GET_CHAT_THREADS: 'GET_CHAT_THREADS',
SET_ACTIVE_THREAD: 'SET_ACTIVE_THREAD',
CREATE_CHAT_THREAD: 'CREATE_CHAT_THREAD',

// Reducer cases
case ActionTypes.GET_CHAT_THREADS:
  return {
    ...state,
    chatThreads: action.payload,
  };

case ActionTypes.SET_ACTIVE_THREAD:
  return {
    ...state,
    activeThreadId: action.payload,
  };

// Action creators
const getChatThreads = useCallback(async () => {
  try {
    const response = await chatAPI.getThreads();
    dispatch({ type: ActionTypes.GET_CHAT_THREADS, payload: response.data });
    return response.data;
  } catch (error) {
    console.error('Error fetching chat threads:', error);
    throw error;
  }
}, []);

const createChatThread = useCallback(async (data) => {
  try {
    const response = await chatAPI.createThread(data);
    dispatch({ type: ActionTypes.CREATE_CHAT_THREAD, payload: response.data });
    return response.data;
  } catch (error) {
    console.error('Error creating chat thread:', error);
    throw error;
  }
}, []);
```

---

## 7. AI Integration Strategy

### Model Selection

```typescript
// Model routing logic based on conversation complexity

function selectModel(threadHistory: Message[]): string {
  const messageCount = threadHistory.length;
  const avgLength = threadHistory.reduce((sum, msg) => sum + msg.content.length, 0) / messageCount;

  // Simple greetings and short questions
  if (messageCount <= 2 && avgLength < 100) {
    return 'gpt-5-nano'; // Fast, cheap
  }

  // Standard conversations
  if (messageCount <= 10) {
    return 'gpt-5-mini'; // Balanced
  }

  // Complex, multi-turn discussions
  return 'gpt-5-flagship'; // Most capable
}
```

### Context Window Management

```typescript
// Keep last N messages to stay within token limits

function buildContext(messages: Message[], maxTokens = 4000): Message[] {
  let totalTokens = 0;
  const context: Message[] = [];

  // Always include system message
  const systemMsg = messages.find(m => m.role === 'SYSTEM');
  if (systemMsg) {
    context.push(systemMsg);
    totalTokens += estimateTokens(systemMsg.content);
  }

  // Add messages from most recent, working backwards
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === 'SYSTEM') continue;

    const tokens = estimateTokens(msg.content);
    if (totalTokens + tokens > maxTokens) break;

    context.unshift(msg);
    totalTokens += tokens;
  }

  return context;
}
```

### System Prompts

```typescript
const SYSTEM_PROMPTS = {
  general: `You are an expert AI tutor for AP STEM subjects (Calculus, Physics, Chemistry, Biology, Statistics). You help students understand concepts through:
  - Clear, step-by-step explanations
  - Socratic questioning to guide discovery
  - Encouraging words and positive reinforcement
  - Breaking down complex problems into manageable parts
  
  Always be patient, supportive, and educational. Never give direct answers without explanation.`,

  withProblem: (problemText: string) => `You are an expert AI tutor helping a student with this problem:
  
  "${problemText}"
  
  Guide the student to understand and solve this problem through thoughtful questions and explanations. Don't give away the answer directly - help them discover it.`,
};
```

---

## 8. User Experience Flow

### Flow 1: Starting a New Chat

```
1. User clicks "AI Tutor" in navigation
   └─> TutorPage loads with ChatPanel

2. ChatPanel displays welcome message
   └─> "Hello! I'm your AI Tutor. Ask me anything!"

3. User types first message
   └─> POST /api/chat/threads (creates thread)
   └─> POST /api/chat/threads/:id/messages (sends message)
   └─> EventSource connects to SSE stream
   └─> AI response streams in real-time
```

### Flow 2: Continuing Existing Chat

```
1. User navigates to TutorPage
   └─> GET /api/chat/threads (loads thread list)
   └─> Auto-select most recent thread

2. GET /api/chat/threads/:id
   └─> Loads full message history
   └─> Displays in ChatPanel

3. User sends new message
   └─> Same flow as Flow 1, step 3
```

### Flow 3: Problem-Specific Chat

```
1. User is on SolveProblemsPage viewing a solution
   └─> Clicks "Ask Tutor" button

2. ChatPanel opens (docked right side)
   └─> Creates thread with problemId in metadata
   └─> System message includes problem context

3. User asks question about the problem
   └─> AI has full context of the problem
   └─> Can reference solution steps
   └─> Provides targeted help
```

### Flow 4: Saving Chat History

```
1. User has valuable conversation
   └─> Clicks "Save to Notes" button

2. Creates SavedItem of type CHAT
   └─> Links to chat thread
   └─> Appears in Notes Hub under "Chat History" folder

3. Later, user opens from Notes Hub
   └─> Loads thread with full history
   └─> Can continue conversation
```

---

## 9. Implementation Phases

### Phase 6.1: Backend Foundation (Week 1)
**Goal:** Create basic chat infrastructure

✅ Tasks:
- [ ] Create `chatRoutes.ts` with all endpoints
- [ ] Create `chatController.ts` with CRUD operations
- [ ] Create `chatService.ts` with business logic
- [ ] Add SSE streaming support
- [ ] Update `server.ts` to include chat routes
- [ ] Test with Postman/Thunder Client

📝 Deliverable: Working chat API with database persistence

---

### Phase 6.2: AI Integration (Week 2)
**Goal:** Connect OpenAI for intelligent responses

✅ Tasks:
- [ ] Update `openaiService.ts` with streaming support
- [ ] Implement model routing logic
- [ ] Add context window management
- [ ] Create system prompts
- [ ] Implement BullMQ worker for chat jobs
- [ ] Add token usage tracking

📝 Deliverable: AI responses streaming to API

---

### Phase 6.3: Frontend Integration (Week 3)
**Goal:** Connect React UI to backend

✅ Tasks:
- [ ] Add chat API helpers to `api.js`
- [ ] Update `ChatPanel.js` with real API calls
- [ ] Implement EventSource for SSE
- [ ] Add loading and error states
- [ ] Update `AppContext` with chat actions
- [ ] Add chat thread management UI
- [ ] Test end-to-end flow

📝 Deliverable: Working chat UI with streaming

---

### Phase 6.4: Enhanced Features (Week 4)
**Goal:** Add advanced capabilities

✅ Tasks:
- [ ] Problem-context linking
- [ ] Save chat to Notes Hub
- [ ] Thread list management
- [ ] Message editing/deletion
- [ ] Typing indicators
- [ ] Read receipts
- [ ] Export chat history

📝 Deliverable: Full-featured chat system

---

### Phase 6.5: Polish & Testing (Week 5)
**Goal:** Production-ready quality

✅ Tasks:
- [ ] Add comprehensive error handling
- [ ] Implement rate limiting
- [ ] Add moderation filters
- [ ] Performance optimization
- [ ] Security audit
- [ ] Load testing
- [ ] User acceptance testing

📝 Deliverable: Production-ready AI Tutor

---

## 10. Testing Strategy

### Unit Tests

```typescript
// chatService.test.ts
describe('Chat Service', () => {
  test('creates thread with correct user', async () => {
    const thread = await chatService.createThread('user123', {});
    expect(thread.userId).toBe('user123');
  });

  test('adds message to thread', async () => {
    const message = await chatService.addMessage('thread123', 'user123', {
      role: 'USER',
      content: 'Hello',
    });
    expect(message.content).toBe('Hello');
  });
});
```

### Integration Tests

```typescript
// chatRoutes.test.ts
describe('Chat API', () => {
  test('POST /chat/threads creates new thread', async () => {
    const response = await request(app)
      .post('/api/chat/threads')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Chat' });

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');
  });

  test('SSE stream sends chunks', async () => {
    // Mock SSE connection test
  });
});
```

### E2E Tests

```javascript
// chat.e2e.test.js
describe('AI Tutor Chat', () => {
  test('user can start conversation', async () => {
    // Login
    // Navigate to Tutor page
    // Type message
    // Verify response appears
  });

  test('streaming works correctly', async () => {
    // Send message
    // Watch for streaming chunks
    // Verify complete message saved
  });
});
```

---

## 11. Security & Performance Considerations

### Security

**1. Authentication & Authorization**
- All chat endpoints require JWT authentication
- Users can only access their own threads
- Thread ownership validated on every request

**2. Input Validation**
- Message length limits (2000 chars max)
- Content sanitization to prevent XSS
- Rate limiting per user (10 messages/minute)

**3. Moderation**
- OpenAI moderation API checks all inputs
- Flagged content logged and blocked
- Admin dashboard for reviewing flagged content

**4. Data Privacy**
- Chat history encrypted at rest
- Sensitive data redacted in logs
- User consent for AI training data

### Performance

**1. Caching**
```typescript
// Cache recent thread summaries
const CACHE_TTL = 5 * 60; // 5 minutes
await redis.set(`thread:${threadId}`, JSON.stringify(thread), 'EX', CACHE_TTL);
```

**2. Database Optimization**
```sql
-- Indexes for fast queries
CREATE INDEX idx_messages_thread_created ON messages(thread_id, created_at);
CREATE INDEX idx_threads_user_updated ON chat_threads(user_id, updated_at);
```

**3. Connection Pooling**
```typescript
// Limit SSE connections per user
const MAX_CONNECTIONS = 3;
if (activeConnections[userId] >= MAX_CONNECTIONS) {
  throw new Error('Too many active connections');
}
```

**4. Resource Limits**
- Max 100 messages per thread displayed (pagination for older)
- SSE connection timeout after 5 minutes idle
- Automatic cleanup of abandoned connections

---

## 12. Monitoring & Analytics

### Metrics to Track

```typescript
// Key metrics
const METRICS = {
  // Usage
  messagesPerDay: 'Number of messages sent',
  activeThreads: 'Number of active conversations',
  avgMessagesPerThread: 'Conversation depth',

  // Performance
  streamLatency: 'Time to first token',
  completionTime: 'Full response time',
  sseConnectionDuration: 'How long users stay connected',

  // Quality
  userSatisfaction: 'Thumbs up/down on responses',
  escalationRate: 'How often we use flagship model',
  errorRate: 'Failed requests',

  // Cost
  tokenUsage: 'Total tokens consumed',
  costPerMessage: 'Average cost per interaction',
};
```

### Logging

```typescript
// Structured logging for debugging
logger.info('Chat message sent', {
  userId,
  threadId,
  messageLength: content.length,
  model: selectedModel,
  duration: responseTime,
});

logger.error('Stream failed', {
  userId,
  threadId,
  error: error.message,
  context: { lastMessages: messages.slice(-3) },
});
```

---

## Conclusion

This implementation plan provides a complete roadmap for building the AI Tutor Chat feature. Key highlights:

✅ **Leverages existing infrastructure** - Uses established patterns from other features  
✅ **Real-time streaming** - Modern SSE approach for live responses  
✅ **Context-aware** - Links to problems and maintains conversation history  
✅ **Scalable** - BullMQ workers and caching for performance  
✅ **Secure** - Proper auth, rate limiting, and moderation  
✅ **User-friendly** - Smooth UX with typing indicators and error handling  

**Next Steps:**
1. Review and approve this spec
2. Start Phase 6.1 (Backend Foundation)
3. Weekly check-ins to track progress
4. User testing after Phase 6.3

**Estimated Timeline:** 5 weeks for full implementation  
**Priority Dependencies:** OpenAI API key, BullMQ setup, Redis for caching

---

**Questions or Concerns?** Please add comments to this document before implementation begins.
