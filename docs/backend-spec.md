Backend Overview

Node.js/Express + TypeScript service exposing REST endpoints consumed by the Next.js UI defined in docs/frontend-spec.md:1.
API gateway routes by domain (auth, problems, notes, study, chat) with Zod validation and OpenAPI docs feeding frontend clients.
Job orchestration via BullMQ/Redis to call GPT‑5 tiers, SymPy/WolframAlpha, and manage retries; responses persisted in Postgres JSONB.
Prisma ORM over PostgreSQL with pgvector; schema versioned migrations, connection pooling through PgBouncer for Vercel/Edge compatibility.
Storage service abstraction currently persisting image blobs in Postgres but ready to flip to S3/R2 by toggling environment config.
Key Modules

Auth & Users: NextAuth handles Google OAuth; Express verifies JWT/session tokens, maintains users, sessions, organizations, audit trails.
Problem Intake: POST /problems stores text, subject, asset metadata; assets use storage service; status transitions (received → queued → solved).
AI Generation: /problems/:id/solutions|hints|concept-notes trigger jobs selecting GPT‑5 Mini/Nano/Flagship per complexity; optional verification sub-step with SymPy/WolframAlpha; results stored in ai_outputs.
Notes Hub: CRUD on folders, notes, saved items; tags, starred states; connectors to generated outputs and chat transcripts.
Study Mode: /study-sessions create variant sets via GPT‑5 Nano, record variant metadata, difficulty, reference note.
Tutor Chat: Streaming responses from GPT‑5 Mini, escalate to Flagship when heuristics flag complexity; conversation memory stored with embeddings for retrieval.
Analytics & Admin: Job dashboards, usage billing hooks, moderation queue, system health endpoints.
Database Design

Core tables: users, sessions, problems, problem_assets, ai_jobs, ai_outputs, hints, concept_notes, notes, folders, study_sessions, study_variants, chat_threads, chat_messages, tags, tag_links, events.
problem_assets includes storage_location, external_key, external_url to support future bucket migration.
pgvector columns on problems, concept_notes, chat_messages with IVF indexes for semantic retrieval.
Soft deletes via deleted_at, optimistic concurrency with updated_at versioning.
Materialized views for reporting (e.g., daily usage) refreshed via cron.
Integration with UI

Next.js pages call REST endpoints with fetch/SWR; AppContext equivalents replaced by hooks hitting /api/*.
File uploads use signed URLs (stubbed to Postgres now), returning asset refs the UI displays in ProblemInputModule and SolveProblems flows.
Display components (SolutionDisplay, HintsDisplay, ConceptNotesDisplay) consume unified payloads {steps[], finalAnswer, confidence, sources} from backend.
Notes Hub and Study Mode pages fetch real data instead of static arrays; router state remains compatible by returning the same shape as current mock objects.
ChatPanel subscribes to SSE/WebSocket stream from /chat/threads/:id/stream, enabling near real-time AI responses and persistence.
Implementation Phases

- [ ] Phase 1 – Foundations: Bootstrap Express TS project, configure env/secrets, add health checks, logging, error handling, OpenAPI scaffold.
- [ ] Phase 2 – Database & Auth: Define Prisma schema, run migrations, integrate NextAuth JWT verification, implement /auth/me, seeding scripts.
- [ ] Phase 3 – Problems & Assets: Build /problems CRUD, storage abstraction (Postgres-backed), subject taxonomy endpoints, status updates, basic list/detail for UI integration.
- [ ] Phase 4 – AI Pipeline: Add BullMQ workers, GPT‑5 model router, AI job table, callbacks storing solutions/hints/concept notes, polling endpoints (/jobs/:id), optional verification hook.
- [ ] Phase 5 – Notes Hub & Study Mode: Implement notes/folder/tag services, study session creation, GPT‑5 Nano variant generation, connect to frontend pages and SavedItem card actions.
- [ ] Phase 6 – Tutor Chat: Build chat thread/message APIs, SSE/WebSocket streaming, escalation logic, moderation filters, conversation persistence with embeddings.
- [ ] Phase 7 – Observability & Scalability: Instrument metrics/logs, add rate limiting, pagination, caching, finalize bucket integration switch (copy assets, toggle config), load tests, documentation.
Each phase ends with manual smoke tests mapping to the existing frontend spec: submit problem, view solution/hints, save to notes, generate study variants, hold a chat session, ensuring the UI’s workflows remain aligned with the newly backed endpoints.Te