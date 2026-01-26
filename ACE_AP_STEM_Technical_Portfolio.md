# ACE AP STEM Technical Portfolio

## Programming Deep Dive for Competition Judges

**Application Name:** ACE AP STEM
**Developer:** [Student Name]
**Competition:** ACE AP STEM Technical Portfolio
**Document Version:** 2.0

---

## How to Read This Document

This document expands on the programming slides from the ACE AP STEM presentation. Each section maps directly to a specific slide, explaining **what the slide demonstrates** and **why it matters** from a software engineering perspective. Code excerpts are kept concise with explanations to show understanding, not just copy-paste ability.

---

## Slide 5: Technology Stack Overview — Expanded Explanation

### What This Slide Proves

This slide demonstrates that thoughtful technology choices were made based on project requirements, not just familiarity. Every layer of the stack was selected for specific technical reasons.

### The Stack at a Glance

| Layer | Technology | Why This Choice |
|-------|------------|-----------------|
| Frontend | React 19 | Component reusability, concurrent rendering for smooth AI streaming |
| Backend | Node.js + Express | JavaScript everywhere = shared code, async I/O for AI calls |
| Database | PostgreSQL | Relational data (users → problems → solutions) needs referential integrity |
| ORM | Prisma | Type-safe queries prevent runtime database errors |
| AI | OpenAI GPT-4o | Vision capability for image problems, structured JSON output |
| Logging | Pino | High-performance JSON logging with pretty-print for development |

### Why Not Other Options?

**Why PostgreSQL over MongoDB?** The data is inherently relational. A problem has many solutions, hints, and concept notes. Solutions belong to problems. Problems belong to users. MongoDB would require manual relationship management and lose referential integrity.

**Why React over Vue/Svelte?** React 19's concurrent rendering allows the UI to stay responsive while streaming AI responses. The ecosystem (hooks, context) handles complex state without external libraries.

**Why Pino over Winston?** Pino is ~5x faster for JSON logging. In a real-time streaming application, logging performance matters.

---

## Slide 6: Frontend Architecture — Expanded Explanation

### What This Slide Proves

The frontend follows a professional feature-based structure that scales. Code is organized by what it does, not by file type.

### Project Structure

```
frontend/src/
├── components/          # Reusable UI pieces
│   ├── common/         # Buttons, inputs, modals (used everywhere)
│   ├── layout/         # Header, sidebar, navigation
│   └── features/       # Problem solver, chat, notes hub
├── context/            # Global state (AppContext.js - 1,082 lines)
├── pages/              # Route-level components
├── hooks/              # Custom React hooks
└── utils/              # API client, helpers
```

### Why Feature-Based Organization?

When adding a new feature (like Study Mode), all related code lives together:
- `components/features/StudyMode/` contains the UI
- Related hooks in `hooks/useStudySession.js`
- State actions already centralized in `context/AppContext.js`

This means a developer can understand a feature by looking at one folder, not hunting across `components/`, `reducers/`, `actions/`, `selectors/`.

---

## Slide 7: Backend Architecture — Expanded Explanation

### What This Slide Proves

The backend follows a layered architecture where each layer has one job. This separation makes the code testable, maintainable, and secure.

### The Four Layers

```
Request → Routes → Controllers → Services → Database
              ↓         ↓           ↓
         (routing)  (validation)  (business logic)
```

**Routes** define URL patterns and attach middleware
**Controllers** handle HTTP request/response, validate input
**Services** contain business logic, talk to database and AI
**Middleware** handles cross-cutting concerns (auth, security, errors)

### Server Setup: Middleware Order Matters

```typescript
// backend/src/server.ts (key middleware)
app.use(helmetMiddleware);      // Security headers FIRST
app.use(corsMiddleware);        // Then CORS
app.use(express.json());        // Parse JSON bodies
app.use(cookieParser());        // Parse cookies for auth
app.use(compression());         // Compress responses
app.use(timeoutMiddleware(30000)); // Prevent hung requests

// Routes AFTER middleware
app.use('/api/problems', problemsRoutes);
app.use('/api/chat', chatRoutes);

// Error handler LAST (catches everything above)
app.use(errorHandler);
```

**Why order matters:** If `errorHandler` came before routes, errors wouldn't be caught. If `helmetMiddleware` came after routes, security headers might not apply to early responses. The order is: security → parsing → compression → routes → errors.

---

## Slide 8: Database Design — Expanded Explanation

### What This Slide Proves

The database schema models real relationships between educational entities. Strategic indexing ensures queries stay fast as data grows.

### Core Entity Relationships

```
User (1) ──────────── (many) Problem
                              │
                              ├── (many) Solution
                              ├── (many) Hint
                              ├── (many) ConceptNote
                              └── (many) ProblemAsset (images)

User (1) ──────────── (many) ChatThread ── (many) Message

User (1) ──────────── (many) SavedItem ── (refs) Problem|Solution|Hint|ConceptNote
```

### Prisma Schema Excerpt

```prisma
// backend/prisma/schema.prisma
model Problem {
  id          String   @id @default(cuid())
  title       String
  description String
  subject     String
  difficulty  String
  userId      String
  status      ProblemStatus @default(RECEIVED)

  // Relations
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  solutions    Solution[]
  hints        Hint[]
  conceptNotes ConceptNote[]

  // Indexes for query performance
  @@index([userId])              // "Get my problems" is fast
  @@index([status])              // "Get pending problems" is fast
  @@index([userId, status])      // "Get my pending problems" is fast
}
```

**Why `onDelete: Cascade`?** When a user deletes their account, all their problems should be deleted too. Without cascade, we'd have orphaned problems in the database. Cascade ensures referential integrity automatically.

**Why compound indexes?** The query "get this user's pending problems" (`WHERE userId = ? AND status = ?`) is extremely common. A compound index on `[userId, status]` makes this query use a single index scan instead of filtering in memory.

---

## Slide 16: Auth & Security — Expanded Explanation

### What This Slide Proves

Security is implemented at multiple layers, not just "add a password check." The system uses JWT tokens, security headers, rate limiting, and input validation.

### JWT Authentication Flow

```
┌─────────────┐     POST /login       ┌─────────────┐      verify         ┌─────────────┐
│   Client    │ ───────────────────→  │   Server    │ ──────────────────→ │  Database   │
│             │    {email, password}  │             │                      │  (bcrypt)   │
│             │                       │             │←── user found ───────│             │
│             │←── {accessToken,      │             │                      │             │
│             │     refreshToken} ────│             │                      │             │
└─────────────┘                       └─────────────┘                      └─────────────┘

      │ (later API calls)
      ▼
┌─────────────┐  Authorization: Bearer <token>  ┌─────────────┐
│   Client    │ ──────────────────────────────→ │   Server    │
│             │                                  │  (verify    │
│             │←── protected data ──────────────│   JWT)      │
└─────────────┘                                  └─────────────┘
```

### Auth Middleware Implementation

```typescript
// backend/src/middleware/auth.ts
export const authenticateToken = async (req, res, next) => {
  // Get token from header OR query param (for SSE)
  const authHeader = req.headers['authorization'];
  let token = authHeader?.split(' ')[1];  // "Bearer TOKEN"

  if (!token && req.query.token) {
    token = req.query.token;  // SSE fallback
  }

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const decoded = jwt.verify(token, JWT_SECRET);
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId }
  });

  req.user = user;  // Attach to request for controllers
  next();
};
```

**Why query param fallback?** EventSource (for SSE) can't set custom headers. The token is passed as `?token=xxx` for streaming endpoints only.

### Rate Limiting Tiers

```typescript
// backend/src/middleware/security.ts

// General API: 100 requests per 15 minutes
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.'
});

// Auth endpoints: 5 attempts per 15 minutes (stricter)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts.'
});

// File uploads: 10 per hour
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
});
```

**Why different limits?** Authentication is a prime target for brute-force attacks—5 attempts per 15 minutes makes guessing passwords impractical. Normal API usage at 100/15min allows legitimate use while preventing abuse. Uploads are expensive (storage, processing) so they're limited hourly.

---

## Slide 17: OpenAI Integration Deep Dive — Expanded Explanation

### What This Slide Proves

AI integration goes beyond "call the API." The system implements intelligent model selection, vision capability for images, and structured output parsing. This 1,231-line service is the technical heart of the application.

### Model Selection Strategy

```typescript
// backend/src/services/openaiService.ts
export const selectModel = (params: ModelSelectionParams): string => {
  const { difficulty, taskType, escalate } = params;

  // Force flagship model if escalation requested
  if (escalate) return 'gpt-4o';

  switch (taskType) {
    case 'solution':
      // Hard problems need GPT-4o's reasoning
      if (difficulty === 'hard') return 'gpt-4o';
      return 'gpt-4o-mini';  // Mini handles easy/medium well

    case 'hints':
    case 'concepts':
    case 'chat':
      return 'gpt-4o-mini';  // Cost-effective for these tasks

    case 'variants':
      return 'gpt-4o-mini';  // Practice problems don't need flagship
  }
};
```

**Why not always use GPT-4o?** Cost and speed. GPT-4o-mini is ~10x cheaper and faster. For a student asking a simple question or generating practice variants, mini is sufficient. Hard calculus problems that need complex reasoning get GPT-4o.

### Image Problem Handling

```typescript
// When problem has images, build vision-capable request
const hasImages = imageData && imageData.length > 0;

const userMessage = hasImages ? {
  role: 'user',
  content: [
    { type: 'text', text: prompt },
    ...imageData.map(img => ({
      type: 'image_url',
      image_url: {
        url: img.base64
          ? `data:${img.mimeType};base64,${img.base64}`
          : img.url
      }
    }))
  ]
} : { role: 'user', content: prompt };
```

**What this enables:** Students photograph a textbook problem, upload the image, and the AI extracts the problem text and solves it. The system automatically detects images and switches to vision-capable processing.

### Structured Output with JSON Mode

```typescript
const completion = await openai.chat.completions.create({
  model: visionModel,
  messages: [...],
  response_format: { type: "json_object" },  // Force JSON
  max_completion_tokens: 3000,
});
```

**Why JSON mode?** Without it, the AI might return markdown, plain text, or inconsistent formats. JSON mode guarantees parseable output that matches our TypeScript interfaces (`SolutionResponse`, `HintsResponse`, etc.).

---

## Slide 19: SSE Streaming — Expanded Explanation

### What This Slide Proves

Real-time AI response streaming creates an engaging "the AI is thinking" experience. This requires careful HTTP handling, connection management, and error recovery.

### The Streaming Flow

```
┌─────────────┐      EventSource       ┌─────────────┐      stream=true     ┌─────────────┐
│   React     │ ──────────────────────→│   Express   │ ────────────────────→│   OpenAI    │
│   Client    │                        │   Server    │                       │   API       │
│             │←─ data: {"chunk":"H"} ─│             │←── chunk: "Hello" ────│             │
│             │←─ data: {"chunk":"e"} ─│             │←── chunk: "ello " ────│             │
│             │←─ data: {"chunk":"..."─│             │←── chunk: "..." ──────│             │
│             │←─ data: [DONE] ────────│             │←── finish_reason ─────│             │
└─────────────┘                        └─────────────┘                       └─────────────┘
```

### SSE Controller Setup

```typescript
// backend/src/controllers/chatController.ts
export const streamResponse = async (req, res) => {
  // Critical SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');  // Disable nginx buffering
  res.flushHeaders();  // Send headers immediately

  const sendSse = (data) => {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  };

  // Handle client disconnect
  req.on('close', () => {
    console.log('Client disconnected');
    cleanup();
  });

  // ... stream processing
};
```

**Why these specific headers?**
- `text/event-stream`: Tells browser this is SSE, not regular HTTP
- `Cache-Control: no-cache`: Prevents proxies from buffering
- `X-Accel-Buffering: no`: Nginx-specific, prevents server-side buffering
- `flushHeaders()`: Sends headers before body, establishing SSE connection

### OpenAI Stream Processing

```typescript
// backend/src/services/chatService.ts
const stream = await openai.chat.completions.create({
  model: selectedModel,
  messages: contextMessages,
  stream: true,  // Enable streaming
  temperature: 0.6,
});

let fullResponse = '';

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || '';
  if (content) {
    fullResponse += content;
    onChunk({ type: 'chunk', content });  // Send to client
  }
}

// Save complete response after streaming finishes
await addMessage(threadId, userId, {
  role: 'ASSISTANT',
  content: fullResponse,
});
```

**Key insight:** The response is streamed to the user in real-time, but also accumulated in `fullResponse` so the complete message can be saved to the database after streaming finishes. Users see instant feedback; the database stores the full conversation.

---

## Slide 20: State Management — Expanded Explanation

### What This Slide Proves

Complex application state is managed through a predictable, scalable pattern without external libraries. The 1,082-line AppContext handles authentication, active problems, chat, notes, and UI state in one organized system.

### The Pattern: Context + useReducer

Instead of Redux (adds bundle size, boilerplate), the app uses React's built-in tools:

```javascript
// frontend/src/context/AppContext.js (simplified structure)
const initialState = {
  // Auth state
  user: null,
  isAuthenticated: false,

  // Problem state
  activeProblem: null,
  activeSolution: null,

  // Chat state
  chatHistory: [],
  activeThreadId: null,

  // UI state
  loading: false,
  error: null
};
```

**Why this structure matters:** Each "slice" of state is clearly named and grouped. When debugging why a solution isn't showing, you look at `activeSolution`. When chat breaks, you check `chatHistory` and `activeThreadId`.

### Action Types for Predictable Updates

```javascript
// Every state change has a named action
const ActionTypes = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  SET_ACTIVE_PROBLEM: 'SET_ACTIVE_PROBLEM',
  GENERATE_SOLUTION: 'GENERATE_SOLUTION',
  ADD_CHAT_MESSAGE: 'ADD_CHAT_MESSAGE',
  // ... 40+ action types total
};
```

**Why named actions?** When something goes wrong, you can trace exactly what happened. "The user clicked Submit, which dispatched `SUBMIT_PROBLEM`, which set `currentProblem` and cleared `activeSolution`." This traceability is impossible with direct state mutation.

### Reducer Example: Handling a New Problem

```javascript
case ActionTypes.SUBMIT_PROBLEM:
  return {
    ...state,                    // Keep all other state
    currentProblem: action.payload,
    activeProblem: action.payload,
    activeSolution: null,        // Clear old solution
    activeHints: [],             // Clear old hints
    displayMode: null,           // Reset display
    error: null                  // Clear any errors
  };
```

**What this shows:** Submitting a new problem is a single atomic operation that updates multiple related pieces of state. The old solution/hints are cleared because they don't apply to the new problem. This prevents showing stale data.

---

## Slide 21: API Design — Expanded Explanation

### What This Slide Proves

The API follows REST conventions with consistent patterns across 40+ endpoints. This predictability makes the API easy to use and debug.

### Endpoint Pattern Example

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/problems` | List user's problems (paginated) |
| GET | `/api/problems/:id` | Get single problem with solutions/hints |
| POST | `/api/problems` | Create new problem |
| PUT | `/api/problems/:id` | Update problem |
| DELETE | `/api/problems/:id` | Delete problem |
| POST | `/api/problems/:id/solutions` | Generate AI solution |
| POST | `/api/problems/:id/hints` | Generate AI hints |

**Why POST for generation?** `POST /problems/:id/solutions` creates a new solution resource. Even though it uses AI, the result is stored in the database—it's a creation operation.

### Controller Implementation: Consistent Response Format

```typescript
// backend/src/controllers/problemsController.ts
export const getAllProblems = async (req, res) => {
  const userId = req.user?.id;  // From auth middleware

  const { page = 1, limit = 10, subject, search } = req.query;

  // Build dynamic filter
  const where = { userId };
  if (subject) where.subject = subject;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Parallel queries for data + count
  const [problems, total] = await Promise.all([
    prisma.problem.findMany({ where, skip, take: limit }),
    prisma.problem.count({ where })
  ]);

  res.json({
    success: true,
    data: problems,
    pagination: { page, limit, total, pages: Math.ceil(total/limit) }
  });
};
```

**Key patterns shown:**
- **Authentication**: `req.user` comes from middleware, not parsed here
- **Dynamic filtering**: Query params build the `where` clause
- **Parallel queries**: `Promise.all` runs count and fetch simultaneously
- **Consistent response**: Always `{ success, data, pagination }`

---

## Slide 22: Error Handling — Expanded Explanation

### What This Slide Proves

Errors are handled systematically, not ad-hoc. A custom error class carries status codes, a global handler catches everything, and responses differ between development and production.

### Custom Error Class

```typescript
// backend/src/middleware/errorHandler.ts
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;  // vs. programming error

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;  // Expected error, not a bug
  }
}

// Usage in controllers:
throw new AppError('Problem not found', 404);
throw new AppError('You do not own this problem', 403);
```

**Why `isOperational`?** Distinguishes "user not found" (operational, expected) from "TypeError: cannot read property of undefined" (programming bug). Operational errors return clean messages; bugs get logged with full stack traces.

### Global Error Handler

```typescript
export const errorHandler = (error, req, res, next) => {
  let statusCode = 500;
  let message = 'Internal server error';

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Log all errors
  logger.error({ error, url: req.url }, 'Error occurred');

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      // Stack trace only in development
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack
      })
    }
  });
};
```

**Why hide stack in production?** Stack traces reveal file paths, line numbers, and internal structure—information attackers can use. Production shows clean error messages; development shows everything for debugging.

---

## Slide 23: Performance Optimizations — Expanded Explanation

### What This Slide Proves

Performance isn't an afterthought. Database indexes, response compression, intelligent timeouts, and React optimizations keep the app responsive.

### Database Indexing Strategy

```prisma
model Problem {
  // Indexes placed on frequently filtered columns
  @@index([userId])           // Filter by owner: O(log n)
  @@index([status])           // Filter by status: O(log n)
  @@index([userId, status])   // Common combination: single lookup
  @@index([createdAt])        // Sort by date: no filesort
}

model Message {
  @@index([threadId])         // Get messages for thread: O(log n)
  @@index([createdAt])        // Sort chronologically: no filesort
}
```

**Without indexes:** "Get user's pending problems" scans entire table, filters in memory.
**With compound index:** Single B-tree lookup, returns only matching rows.

### Intelligent Timeout Middleware

```typescript
// backend/src/middleware/security.ts
export const timeoutMiddleware = (defaultMs = 30000) => {
  return (req, res, next) => {
    let timeoutMs = defaultMs;

    // AI endpoints need longer
    if (req.path.includes('/solutions') ||
        req.path.includes('/hints') ||
        req.path.includes('/concept-notes')) {
      timeoutMs = 180000;  // 3 minutes for AI
    }

    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({ error: 'Request timeout' });
      }
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timeout));
    next();
  };
};
```

**Why different timeouts?** Normal API calls should complete in 30 seconds. But AI generation (especially for hard problems with images) can legitimately take 1-2 minutes. A single timeout would either kill valid AI requests or allow normal requests to hang forever.

### Response Compression

```typescript
import compression from 'compression';
app.use(compression());
```

This single line reduces JSON response sizes by 60-80%. A 50KB problem list becomes ~15KB over the wire. For users on slow connections, this is the difference between "snappy" and "sluggish."

---

## Technical Achievement Summary

### By the Numbers

| Metric | Value |
|--------|-------|
| Backend Service Code | ~1,600 lines (openaiService + chatService) |
| State Management | 1,082 lines (single organized file) |
| Database Tables | 15 with strategic indexing |
| API Endpoints | 40+ across 12 route files |
| AI Features | 5 (solutions, hints, concepts, chat, study mode) |
| Auth Methods | 2 (email/password + Google OAuth) |

### Key Technical Decisions

1. **Context + useReducer over Redux** — Sufficient for this app's needs, zero external dependencies, 40+ action types for full traceability

2. **Pino over Winston** — 5x faster logging, matters for real-time streaming

3. **PostgreSQL over MongoDB** — Data is relational; referential integrity prevents bugs

4. **SSE over WebSockets** — Simpler for one-way streaming, no socket management

5. **Intelligent model selection** — GPT-4o for hard problems, mini for everything else = 90% cost reduction on most requests

### What Makes This More Than a Tutorial Project

- **Production error handling**: Different behavior for dev/prod, operational vs. programming errors
- **Real rate limiting**: Tiered limits for auth, API, uploads
- **Database optimization**: Compound indexes for actual query patterns
- **Streaming architecture**: Full SSE implementation with disconnect handling
- **Type safety end-to-end**: Prisma types flow from database to API to frontend

---

*Document prepared for ACE AP STEM Technical Portfolio Competition*
*All code excerpts are from the production codebase*
