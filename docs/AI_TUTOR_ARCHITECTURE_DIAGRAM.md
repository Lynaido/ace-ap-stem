# AI Tutor Chat - Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                   USER BROWSER                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                          React Frontend (CRA)                             │  │
│  ├──────────────────────────────────────────────────────────────────────────┤  │
│  │                                                                           │  │
│  │  ┌─────────────────┐                    ┌──────────────────┐            │  │
│  │  │   TutorPage     │                    │  SolveProblems   │            │  │
│  │  │  (Full Screen)  │                    │    Page          │            │  │
│  │  │                 │                    │  ┌────────────┐  │            │  │
│  │  │  ┌───────────┐  │                    │  │  ChatPanel │  │            │  │
│  │  │  │ChatPanel  │  │                    │  │  (Docked)  │  │            │  │
│  │  │  │(Expanded) │  │                    │  └────────────┘  │            │  │
│  │  │  └───────────┘  │                    └──────────────────┘            │  │
│  │  └─────────────────┘                                                     │  │
│  │                                                                           │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │  │
│  │  │              ChatPanel Component Logic                           │    │  │
│  │  ├─────────────────────────────────────────────────────────────────┤    │  │
│  │  │  • useState for messages, input, loading                         │    │  │
│  │  │  • useEffect for SSE EventSource                                 │    │  │
│  │  │  • handleSendMessage → POST to API                               │    │  │
│  │  │  • Streaming text display with cursor animation                  │    │  │
│  │  │  • Auto-scroll to bottom                                         │    │  │
│  │  └─────────────────────────────────────────────────────────────────┘    │  │
│  │                                                                           │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │  │
│  │  │                   AppContext (Global State)                      │    │  │
│  │  ├─────────────────────────────────────────────────────────────────┤    │  │
│  │  │  State:                          Actions:                        │    │  │
│  │  │  • chatThreads: []               • getChatThreads()              │    │  │
│  │  │  • activeThreadId: null          • createChatThread()            │    │  │
│  │  │  • chatHistory: []               • addChatMessage()              │    │  │
│  │  │                                  • clearChat()                   │    │  │
│  │  └─────────────────────────────────────────────────────────────────┘    │  │
│  │                                                                           │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                         API Helper (utils/api.js)                         │  │
│  ├──────────────────────────────────────────────────────────────────────────┤  │
│  │  chatAPI.createThread(data)      →  POST /api/chat/threads               │  │
│  │  chatAPI.getThreads()            →  GET  /api/chat/threads               │  │
│  │  chatAPI.getThread(id)           →  GET  /api/chat/threads/:id           │  │
│  │  chatAPI.sendMessage(id, msg)    →  POST /api/chat/threads/:id/messages  │  │
│  │  chatAPI.getStreamUrl(id)        →  EventSource SSE connection           │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
└──────────────────────┬───────────────────────────┬──────────────────────────────┘
                       │                           │
                       │ HTTP POST/GET             │ Server-Sent Events (SSE)
                       │ (REST API)                │ (Real-time streaming)
                       ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              EXPRESS.JS BACKEND                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                    Routes (routes/chatRoutes.ts)                          │  │
│  ├──────────────────────────────────────────────────────────────────────────┤  │
│  │  POST   /api/chat/threads              → createThread()                  │  │
│  │  GET    /api/chat/threads              → getThreads()                    │  │
│  │  GET    /api/chat/threads/:id          → getThreadById()                 │  │
│  │  POST   /api/chat/threads/:id/messages → sendMessage()                   │  │
│  │  GET    /api/chat/threads/:id/stream   → streamResponse() [SSE]          │  │
│  │  DELETE /api/chat/threads/:id          → deleteThread()                  │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │              Controller (controllers/chatController.ts)                   │  │
│  ├──────────────────────────────────────────────────────────────────────────┤  │
│  │  • Validate input with Zod schemas                                       │  │
│  │  • Extract userId from JWT token                                         │  │
│  │  • Call service layer methods                                            │  │
│  │  • Handle errors and return JSON responses                               │  │
│  │  • Set SSE headers for streaming endpoint                                │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                Service (services/chatService.ts)                          │  │
│  ├──────────────────────────────────────────────────────────────────────────┤  │
│  │                                                                           │  │
│  │  createThread(userId, data)                                              │  │
│  │    ├─> Create ChatThread in DB                                           │  │
│  │    ├─> If problemId provided, add system message with context            │  │
│  │    └─> Return thread object                                              │  │
│  │                                                                           │  │
│  │  getUserThreads(userId)                                                  │  │
│  │    ├─> Query all threads for user                                        │  │
│  │    ├─> Include last message preview                                      │  │
│  │    └─> Order by updatedAt DESC                                           │  │
│  │                                                                           │  │
│  │  getThreadWithMessages(threadId, userId)                                 │  │
│  │    ├─> Verify ownership                                                  │  │
│  │    ├─> Fetch thread with all messages                                    │  │
│  │    └─> Order messages by createdAt ASC                                   │  │
│  │                                                                           │  │
│  │  addMessage(threadId, userId, data)                                      │  │
│  │    ├─> Verify thread ownership                                           │  │
│  │    ├─> Create Message in DB                                              │  │
│  │    ├─> Update thread updatedAt                                           │  │
│  │    └─> Return message object                                             │  │
│  │                                                                           │  │
│  │  enqueueAIResponse(threadId, userId, problemId?)                         │  │
│  │    ├─> Create AI job in queue                                            │  │
│  │    ├─> Pass thread context                                               │  │
│  │    └─> Return job ID                                                     │  │
│  │                                                                           │  │
│  │  streamAIResponse(threadId, userId, onChunk)                             │  │
│  │    ├─> Fetch conversation history                                        │  │
│  │    ├─> Build context with system prompt                                  │  │
│  │    ├─> Stream from OpenAI API                                            │  │
│  │    ├─> Call onChunk() for each token                                     │  │
│  │    ├─> Save complete response to DB                                      │  │
│  │    └─> Call onChunk({ type: 'done' })                                    │  │
│  │                                                                           │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
└──────────────────────┬──────────────────────────┬──────────────────────────────┘
                       │                          │
                       │                          │
                       ▼                          ▼
         ┌─────────────────────────┐   ┌─────────────────────────┐
         │   PostgreSQL Database    │   │   OpenAI API (GPT-5)   │
         ├─────────────────────────┤   ├─────────────────────────┤
         │                         │   │                         │
         │  chat_threads           │   │  Model Router:          │
         │  ├─ id                  │   │  • gpt-5-nano (fast)    │
         │  ├─ userId              │   │  • gpt-5-mini (default) │
         │  ├─ title               │   │  • gpt-5-flagship       │
         │  ├─ createdAt           │   │                         │
         │  └─ updatedAt           │   │  Streaming:             │
         │                         │   │  • Token-by-token       │
         │  messages               │   │  • Real-time chunks     │
         │  ├─ id                  │   │  • Complete on finish   │
         │  ├─ threadId            │   │                         │
         │  ├─ role (enum)         │   │  System Prompt:         │
         │  ├─ content             │   │  "You are an expert     │
         │  ├─ metadata (json)     │   │   AI tutor..."          │
         │  └─ createdAt           │   │                         │
         │                         │   │  Context Management:    │
         │  ai_jobs                │   │  • Last N messages      │
         │  ├─ id                  │   │  • Token limit: 4000    │
         │  ├─ type                │   │  • Problem context      │
         │  ├─ status              │   │                         │
         │  ├─ input (json)        │   │  Moderation Filter:     │
         │  ├─ output (json)       │   │  • Inappropriate check  │
         │  └─ error               │   │  • Educational focus    │
         │                         │   │                         │
         └─────────────────────────┘   └─────────────────────────┘
                       │                          │
                       └──────────────┬───────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │   BullMQ Job Queue      │
                         ├─────────────────────────┤
                         │                         │
                         │  chat-response jobs:    │
                         │  ├─ threadId            │
                         │  ├─ userId              │
                         │  ├─ problemId (opt)     │
                         │  └─ priority            │
                         │                         │
                         │  Worker Process:        │
                         │  ├─ Poll for jobs       │
                         │  ├─ Call OpenAI API     │
                         │  ├─ Stream response     │
                         │  └─ Save to DB          │
                         │                         │
                         └─────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW SUMMARY                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. USER SENDS MESSAGE                                                          │
│     User types → ChatPanel → POST /chat/threads/:id/messages                    │
│     → chatController.sendMessage() → chatService.addMessage()                   │
│     → Save to DB → Enqueue AI job → Return message ID to frontend               │
│                                                                                  │
│  2. AI GENERATES RESPONSE (Real-time Streaming)                                 │
│     BullMQ Worker → chatService.streamAIResponse()                              │
│     → openaiService.streamChatCompletion()                                      │
│     → For each token: Send via SSE to frontend                                  │
│     → ChatPanel EventSource receives chunks                                     │
│     → Display streaming text with cursor                                        │
│     → On complete: Save full response to DB                                     │
│                                                                                  │
│  3. LOAD CHAT HISTORY                                                           │
│     User opens chat → GET /chat/threads/:id                                     │
│     → chatController.getThreadById() → chatService.getThreadWithMessages()      │
│     → Fetch from DB → Return full conversation                                  │
│     → ChatPanel displays all messages                                           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                         TECHNOLOGY STACK SUMMARY                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Frontend:                                  Backend:                             │
│  • React 18                                 • Node.js + Express                  │
│  • React Context API (state)               • TypeScript                         │
│  • EventSource (SSE client)                • Prisma ORM                         │
│  • fetch API (HTTP requests)               • PostgreSQL                         │
│  • CSS Modules (styling)                   • BullMQ (job queue)                 │
│                                             • JWT (authentication)               │
│  AI/ML:                                     • SSE (streaming)                    │
│  • OpenAI GPT-5 API                        • Zod (validation)                   │
│  • Streaming completions                   • Pino (logging)                     │
│  • Context management                                                            │
│  • Moderation filters                                                            │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Key Features Illustrated:

### 1. **Dual Entry Points**
- Full-screen TutorPage for dedicated chat sessions
- Docked ChatPanel on SolveProblemsPage for contextual help

### 2. **Real-time Streaming**
- Server-Sent Events (SSE) for live AI responses
- Token-by-token display with typing animation
- No waiting for complete response

### 3. **Persistent Storage**
- All conversations saved to PostgreSQL
- Chat threads can be revisited
- Full message history maintained

### 4. **Context Awareness**
- Links to specific problems
- System messages provide problem context
- AI has full conversation history

### 5. **Scalable Architecture**
- BullMQ for async job processing
- Separate worker processes for AI calls
- Database indexing for fast queries

### 6. **Clean Separation of Concerns**
- Routes → Controllers → Services → Database
- Frontend state management via Context API
- API helpers abstract backend communication

---

**Related Documents:**
- [AI_TUTOR_IMPLEMENTATION_SPEC.md](./AI_TUTOR_IMPLEMENTATION_SPEC.md) - Full technical spec
- [AI_TUTOR_BEHAVIOR_GUIDE.md](./AI_TUTOR_BEHAVIOR_GUIDE.md) - User experience guide
