Backend Overview

Build a standalone Node.js/Express backend in TypeScript that serves the current Create React App (CRA) UI over HTTPS. The service exposes REST endpoints grouped by domain (auth, problems, notes, study, chat). Prisma manages PostgreSQL with pgvector for semantic search. A storage service abstraction saves image uploads to Postgres today while staying ready to swap to S3/R2 later. BullMQ workers handle AI-generating jobs against GPT-5 tiers with optional SymPy/WolframAlpha verification. CORS, JWT auth, and rate limiting ensure the CRA app can consume the API securely from the browser.

API & Integration Strategy

- REST-first design hosted at api.yourdomain.com, consumed directly from CRA via fetch/axios.
- OpenAPI/Swagger spec generated from Zod validators to type client helpers.
- Enable CORS for the CRA origin; use httpOnly session cookies or Authorization headers for JWTs.
- Uploads exposed via multipart POST /uploads returning asset metadata; CRA uses FormData today, switch to signed URLs later without breaking contracts.
- Provide SDK-like utility functions in the React context to centralize API calls and maintain compatibility with existing components.

Core Modules

Auth & Users
- Email/password plus Google OAuth using Passport.js or custom Google integration.
- Issue refresh/access JWT pair; CRA stores refresh token in httpOnly cookie, access token in memory.
- Expose /auth/register, /auth/login, /auth/refresh, /auth/logout, /auth/me endpoints; protect domain routes with middleware.

Problems & Assets
- POST /problems accepts text + optional image; assets stored via storage service (Postgres bytea now, object store later).
- GET /problems, GET /problems/:id return normalized problem records for reuse in Notes Hub, Study Mode.
- Status lifecycle: received ? queued ? solved, surfaced to UI for loading indicators.

AI Generation
- POST /problems/:id/solutions, /hints, /concept-notes enqueue BullMQ jobs.
- Model router chooses GPT-5 Mini default, GPT-5 Nano for lightweight tasks, GPT-5 Flagship for escalations.
- Optional SymPy/WolframAlpha verification stage attaches check results to responses.
- Jobs recorded in ai_jobs; outputs persisted in ai_outputs as JSONB.

Notes Hub
- CRUD for folders, notes, saved_items with tagging and starring.
- Link saved items to underlying problem/solution/hint IDs for quick retrieval.
- Provide pagination & search filters to match current NotesHub UI.

Study Mode
- POST /study-sessions create sessions tied to a saved problem; GPT-5 Nano generates variants.
- GET /study-sessions/:id returns variants and metadata for StudyModePage.
- Allow regeneration, tagging, difficulty ratings.

Tutor Chat
- POST /chat/threads to start a conversation; POST /chat/threads/:id/messages to send messages.
- SSE endpoint /chat/threads/:id/events streams AI responses; CRA subscribes via EventSource.
- Persist messages in chat_messages with vector embeddings for retrieval.

Analytics & Admin
- Health, metrics, job/admin endpoints (protected) for monitoring.
- Audit log table for critical actions (auth events, content saves, AI escalations).

Data & Storage

- PostgreSQL schema mirrors the frontend needs: users, sessions, problems, problem_assets, ai_jobs, ai_outputs, hints, concept_notes, notes, folders, study_sessions, study_variants, chat_threads, chat_messages, tags, tag_links, events.
- problem_assets columns storage_location, external_key, external_url allow future bucket migration.
- pgvector columns on problems, concept_notes, chat_messages enable similarity search and retrieval-augmented prompts.
- Soft deletes and optimistic locking guard against accidental overwrites from concurrent React clients.
- Daily materialized views for analytics (usage per feature, generation counts).

AI Workflow

1. CRA triggers REST request (e.g., solve problem).
2. API validates payload, creates ai_job row, enqueues BullMQ task.
3. Worker selects GPT-5 tier, optionally calls SymPy/WolframAlpha, stores outputs.
4. API notifies frontend via polling (`GET /jobs/:id`) or SSE when completed.
5. UI updates context state with canonical response shape `{ steps, finalAnswer, confidence, sources }` already expected by components.

Frontend Integration Notes

- Existing React context actions replace mocked setTimeout calls with API helpers.
- Maintain current component props and shapes; backend responses follow the mock formats to minimize UI refactor.
- Sign-in context hydrates from /auth/me on app load; protect routes in the router by checking context state.
- ChatPanel adds useEffect to open EventSource stream; fallback to long-polling if SSE unavailable.
- The Upload zone posts multipart data to /uploads, then associates the returned asset ID during /problems submission.

Implementation Phases

✅ **Phase 1 – Foundations** (COMPLETED)
- ✅ Scaffold Express TS project, shared env config, logger (Pino), error middleware, OpenAPI docs.
- ✅ Add health check, version endpoint, CORS, helmet, rate limiting (basic).
- ✅ Ship CRA with mocks still active while endpoints are being verified manually (Postman).

✅ **Phase 2 – Database & Auth** (COMPLETED)
- ✅ Define Prisma schema, run migrations, seed admin user.
- ✅ Implement auth endpoints with bcrypt hashing, JWT issuance/refresh flow, Google OAuth handshake.
- ✅ Integrate CRA SignIn/SignUp by swapping context mock login with real API calls; persist session across reloads.

**✅ Phase 2 Frontend Integration (COMPLETED):**
- ✅ Replace mock authentication in AppContext with real API calls to /auth endpoints
- ✅ Add ProtectedRoute component to wrap sensitive pages (Problem Upload, Notes Hub, Study Mode)
- ✅ Implement toast notifications for login/register/logout success and error states
- ✅ Update Header component to show/hide navigation links based on authentication status
- ✅ Add session persistence using JWT tokens stored in localStorage and httpOnly cookies
- ✅ Implement proper error handling and user feedback for all authentication flows

✅ **Phase 3 – Problems & Assets** (COMPLETED)
- Implement /subjects, /problems CRUD, /uploads multipart handling (Postgres storage).
- Replace ProblemInputModule mock actions with real submissions and listing endpoints.
- Display stored problems after reload to confirm persistence.

✅**Phase 3 Frontend Integration:**
- Update ProblemInputModule to use real /problems API endpoints instead of mock data
- Implement file upload functionality using multipart/form-data to /uploads endpoint
- Add image preview and management for uploaded problem assets
- Update problem listing components to fetch from /problems API
- Implement proper loading states and error handling for problem operations
- Add problem persistence verification (problems should survive page reloads)

Phase 4 – AI Pipeline
- Add BullMQ workers, GPT-5 router, ai_jobs/ai_outputs persistence, job status polling.
- Wire Solve Problem/Hints/Concept Notes buttons to call APIs and render real AI output.
- Surface job status, retry logic, and error states in CRA context.

**Phase 4 Frontend Integration:**
- Replace mock AI generation in context with real API calls to /problems/:id/solutions, /hints, /concept-notes
- Implement job status polling using /jobs/:id endpoint to show loading states
- Add retry mechanisms and error handling for failed AI generations
- Update SolutionDisplay, HintsDisplay, and ConceptNotesDisplay components to render real AI outputs
- Implement queue status indicators and progress tracking for AI operations
- Add fallback handling for when AI services are unavailable

Phase 5 – Notes Hub & Study Mode
- Build folders/notes/tag endpoints, saved item APIs, and study session services.
- Update NotesHubPage to fetch real data, support starring/tagging.
- Connect StudyModePage to new endpoints for variant generation and regeneration.

**Phase 5 Frontend Integration:**
- Replace mock data in NotesHubPage with real API calls to /folders, /notes, /saved-items endpoints
- Implement tagging system with /tags API for organizing saved content
- Add starring/favoriting functionality for problems, solutions, hints, and concept notes
- Update StudyModePage to use /study-sessions API for generating problem variants
- Implement pagination and search filters for notes and saved items
- Add real-time updates when content is saved or modified

Phase 6 – Tutor Chat
- Implement chat thread/message APIs, SSE streaming, escalation heuristics, moderation filters.
- Update ChatPanel to send messages via REST and stream AI replies; store history for rehydration.

**Phase 6 Frontend Integration:**
- Replace mock chat functionality with real API calls to /chat/threads and /chat/messages endpoints
- Implement Server-Sent Events (SSE) using EventSource for real-time AI responses
- Add chat history persistence and rehydration on page reload
- Implement message streaming UI with typing indicators and real-time updates
- Add moderation features and content filtering for user messages
- Implement chat thread management and conversation history

Phase 7 – Observability & Scalability
- Add Sentry/instrumentation, structured metrics, pagination/caching, improved rate limits.
- Prepare storage swap path (migrate existing assets to bucket, flip storage_location flag when ready).
- Finalize docs, run load tests, add automated smoke scripts matching manual test checklist.

Manual Testing Milestones

After each phase, run the CRA app locally and verify:
1. Phase 2: Real login/logout persists; `/auth/me` populates context.
2. Phase 3: Problem submissions survive reload; uploaded images render from DB.
3. Phase 4: Solve/Hints/Concept Notes display generated outputs with correct loading states.
4. Phase 5: Notes Hub shows saved items, Study Mode generates personalized variants.
5. Phase 6: Tutor chat streams responses live, retains history.
6. Phase 7: System remains stable under smoke/load tests; metrics and logging confirm health.
