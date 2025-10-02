# Phase 4 Implementation Checklist

**Date:** October 3, 2025  
**Goal:** Replace mock data with real AI-powered features

---

## 🎯 Quick Reference

**Current Status:**
- ✅ Phase 1: Foundations (100%)
- ✅ Phase 2: Auth & Database (100%)
- ✅ Phase 3: Problems & Assets (100%)
- ⚠️ Phase 4: AI Pipeline (10% - Study Mode variants only)
- ✅ Phase 5: Notes Hub & Study Mode (85%)
- ❌ Phase 6: Chat (5%)

**Critical Mock Data Locations:**
- `src/pages/SolveProblemsPage.js` - Lines 104-199 (createMock functions)
- `src/components/chat/ChatPanel.js` - Lines 46-53 (mock AI response)

---

## Backend Tasks

### 1. Expand OpenAI Service
**File:** `backend/src/services/openaiService.ts`

- [ ] Add `generateSolution()` function
  - [ ] Define SolutionResponse interface
  - [ ] Implement prompt engineering for solutions
  - [ ] Add model tier selection logic
  - [ ] Parse and validate OpenAI response
  - [ ] Handle errors gracefully

- [ ] Add `generateHints()` function
  - [ ] Define Hint interface
  - [ ] Create hint generation prompt
  - [ ] Parse hints array from response
  - [ ] Validate hint structure

- [ ] Add `generateConceptNotes()` function
  - [ ] Define ConceptNote interface
  - [ ] Create concept notes prompt
  - [ ] Parse concept notes with different types
  - [ ] Validate response structure

- [ ] Add `generateChatResponse()` function (Phase 6)
  - [ ] Implement streaming response
  - [ ] Handle chat context
  - [ ] Add conversation history

- [ ] Add model selection utility
  - [ ] `selectModel()` function
  - [ ] Tier-based routing (nano/mini/flagship)
  - [ ] Difficulty-based escalation

### 2. Create Problem Controller Endpoints
**File:** `backend/src/controllers/problemsController.ts`

- [ ] `generateSolution` endpoint
  - [ ] Fetch problem from database
  - [ ] Create AiJob record
  - [ ] Call openaiService.generateSolution()
  - [ ] Save Solution to database
  - [ ] Update problem status to SOLVED
  - [ ] Return response

- [ ] `generateHints` endpoint
  - [ ] Fetch problem
  - [ ] Create AiJob record
  - [ ] Generate hints via OpenAI
  - [ ] Save multiple Hint records
  - [ ] Return hints array

- [ ] `generateConceptNotes` endpoint
  - [ ] Fetch problem
  - [ ] Create AiJob record
  - [ ] Generate concept notes
  - [ ] Save ConceptNote records
  - [ ] Return concept notes

### 3. Create Job Controller
**File:** `backend/src/controllers/jobsController.ts` (NEW)

- [ ] Create new controller file
- [ ] `getJobStatus` endpoint
  - [ ] Fetch AiJob by ID
  - [ ] Return job status, output, error
  - [ ] Handle not found case

### 4. Add Routes
**File:** `backend/src/routes/problemsRoutes.ts`

- [ ] Add route: `POST /api/problems/:id/solutions`
- [ ] Add route: `POST /api/problems/:id/hints`
- [ ] Add route: `POST /api/problems/:id/concept-notes`

**File:** `backend/src/routes/jobsRoutes.ts` (NEW)

- [ ] Create new routes file
- [ ] Add route: `GET /api/jobs/:id`
- [ ] Export router

**File:** `backend/src/server.ts`

- [ ] Import jobsRoutes
- [ ] Add `app.use('/api/jobs', jobsRoutes)`

### 5. Update Prisma Schema (if needed)
**File:** `backend/prisma/schema.prisma`

- [ ] Verify Solution model has correct fields
- [ ] Verify Hint model has correct fields
- [ ] Verify ConceptNote model has correct fields
- [ ] Verify AiJob model has all required fields
- [ ] Run migration if changes made

---

## Frontend Tasks

### 6. Update API Client
**File:** `src/utils/api.js`

- [ ] Add to problemAPI:
  ```javascript
  generateSolution: (id, options) => apiClient.post(`/api/problems/${id}/solutions`, options)
  generateHints: (id, options) => apiClient.post(`/api/problems/${id}/hints`, options)
  generateConceptNotes: (id, options) => apiClient.post(`/api/problems/${id}/concept-notes`, options)
  ```

- [ ] Create jobAPI:
  ```javascript
  export const jobAPI = {
    getStatus: (jobId) => apiClient.get(`/api/jobs/${jobId}`)
  }
  ```

### 7. Update AppContext
**File:** `src/context/AppContext.js`

- [ ] Add new action types:
  - [ ] `START_AI_GENERATION`
  - [ ] `AI_GENERATION_SUCCESS`
  - [ ] `AI_GENERATION_FAILED`
  - [ ] `SET_AI_JOB_STATUS`

- [ ] Add state fields:
  - [ ] `currentAIJob`
  - [ ] `aiJobStatus`
  - [ ] `generationError`

- [ ] Add reducer cases for new actions

- [ ] Create action functions:
  - [ ] `generateAISolution(problemId, options)`
  - [ ] `generateAIHints(problemId, options)`
  - [ ] `generateAIConceptNotes(problemId, options)`
  - [ ] `pollJobStatus(jobId, type)` (helper)

- [ ] Export new actions in actions object

### 8. Update SolveProblemsPage
**File:** `src/pages/SolveProblemsPage.js`

- [ ] **REMOVE** mock functions:
  - [ ] Delete `createMockSolution()` (line 104)
  - [ ] Delete `createMockHints()` (line 141)
  - [ ] Delete `createMockConceptNotes()` (line 164)

- [ ] Import new context actions:
  ```javascript
  const { 
    generateAISolution,
    generateAIHints,
    generateAIConceptNotes 
  } = useAppContext();
  ```

- [ ] Update `handleSolveProblem`:
  - [ ] Remove setTimeout mock delay
  - [ ] After createProblem, call generateAISolution
  - [ ] Handle loading states properly
  - [ ] Add error handling with toast

- [ ] Update `handleGenerateHints`:
  - [ ] Remove setTimeout mock delay
  - [ ] Call generateAIHints with problemId
  - [ ] Handle response

- [ ] Update `handleGenerateConceptNotes`:
  - [ ] Remove setTimeout mock delay
  - [ ] Call generateAIConceptNotes with problemId
  - [ ] Handle response

- [ ] Update render section:
  - [ ] Verify SolutionDisplay gets activeSolution from context
  - [ ] Verify HintsDisplay gets activeHints from context
  - [ ] Verify ConceptNotesDisplay gets activeConceptNotes from context

### 9. Verify Component Props
**No changes needed, just verify:**

- [ ] SolutionDisplay expects: `{ solution: { steps, finalAnswer, confidence }, problemText }`
- [ ] HintsDisplay expects: `{ hints: [{ type, text, explanation, isAnswer }], problemText }`
- [ ] ConceptNotesDisplay expects: `{ conceptNotes: [{ id, type, title, description, ... }], problemText }`

---

## Testing Tasks

### 10. Backend Unit Tests

- [ ] Test `openaiService.generateSolution()`
  - [ ] Returns valid structure
  - [ ] Handles errors gracefully
  - [ ] Validates response format

- [ ] Test `openaiService.generateHints()`
  - [ ] Returns correct number of hints
  - [ ] Each hint has required fields

- [ ] Test `openaiService.generateConceptNotes()`
  - [ ] Returns multiple note types
  - [ ] Validates note structure

### 11. Backend Integration Tests

- [ ] Test solution generation flow
  - [ ] Create problem → Generate solution → Verify DB
  - [ ] Check AiJob status updates
  - [ ] Verify Solution record created

- [ ] Test hints generation flow
  - [ ] Generate hints → Verify Hint records
  - [ ] Check correct count

- [ ] Test concept notes generation flow
  - [ ] Generate notes → Verify ConceptNote records
  - [ ] Check different types

### 12. Frontend Integration Tests

- [ ] Test API client functions
  - [ ] problemAPI.generateSolution() calls correct endpoint
  - [ ] problemAPI.generateHints() calls correct endpoint
  - [ ] problemAPI.generateConceptNotes() calls correct endpoint

- [ ] Test context integration
  - [ ] generateAISolution updates context state
  - [ ] generateAIHints updates activeHints
  - [ ] generateAIConceptNotes updates activeConceptNotes

### 13. Manual End-to-End Testing

**Solution Generation:**
- [ ] Enter problem text
- [ ] Select subject
- [ ] Click "Solve Problem"
- [ ] Verify loading indicator shows
- [ ] Verify solution renders in < 20 seconds
- [ ] Verify solution has multiple steps
- [ ] Verify step navigation works
- [ ] Verify "Show All" toggle works
- [ ] Verify final answer displays

**Hints Generation:**
- [ ] Enter problem text
- [ ] Select subject
- [ ] Click "Step-by-Step Hints"
- [ ] Verify hints generate
- [ ] Verify "Reveal Next Hint" works
- [ ] Verify progressive disclosure
- [ ] Verify "Show Final Answer" works
- [ ] Verify "Reset Hints" works

**Concept Notes Generation:**
- [ ] Enter problem text
- [ ] Select subject
- [ ] Click "Generate Concept Notes"
- [ ] Verify concept notes tabs render
- [ ] Verify different note types show
- [ ] Verify formulas display
- [ ] Verify examples display
- [ ] Verify tips display

**Cross-Subject Testing:**
- [ ] Test with AP Physics
- [ ] Test with AP Chemistry
- [ ] Test with AP Biology
- [ ] Test with AP Calculus
- [ ] Test with AP Computer Science

**Error Handling:**
- [ ] Test with invalid OpenAI key
- [ ] Test with network failure
- [ ] Test with timeout
- [ ] Verify error messages show
- [ ] Verify retry works

**Performance:**
- [ ] Measure average response time
- [ ] Test with 5 concurrent requests
- [ ] Monitor token usage
- [ ] Check database performance

---

## Deployment Tasks

### 14. Environment Setup

- [ ] Set `OPENAI_API_KEY` in backend .env
- [ ] Verify DATABASE_URL is correct
- [ ] Set JWT secrets
- [ ] Configure CORS for frontend URL
- [ ] Set appropriate rate limits

### 15. Database Migration

- [ ] Run `npm run db:migrate` in backend
- [ ] Verify all tables exist
- [ ] Check indexes on problemId fields
- [ ] Seed test data if needed

### 16. Monitoring Setup

- [ ] Add logging for AI requests
- [ ] Track response times
- [ ] Monitor token usage
- [ ] Set up error alerts
- [ ] Create dashboard for metrics

---

## Documentation Tasks

### 17. Code Documentation

- [ ] Add JSDoc comments to new functions
- [ ] Document API endpoints in Swagger
- [ ] Update README with AI features
- [ ] Document environment variables
- [ ] Add inline comments for complex logic

### 18. User Documentation

- [ ] Update user guide with AI features
- [ ] Add FAQ for common issues
- [ ] Document expected response times
- [ ] Explain model tiers
- [ ] Add troubleshooting guide

---

## Optimization Tasks (Post-MVP)

### 19. Caching Implementation

- [ ] Cache frequently requested problems
- [ ] Implement Redis for solution cache
- [ ] Add cache invalidation logic
- [ ] Monitor cache hit rates

### 20. Performance Optimization

- [ ] Optimize prompts for token efficiency
- [ ] Implement request batching
- [ ] Add connection pooling
- [ ] Optimize database queries
- [ ] Add CDN for static assets

### 21. Advanced Features

- [ ] SymPy verification integration
- [ ] WolframAlpha verification
- [ ] Multi-language support
- [ ] LaTeX rendering for math
- [ ] Export to PDF

---

## Phase 6 Tasks (Chat Integration)

### 22. Chat Backend

- [ ] Create chat endpoints
  - [ ] `POST /api/chat/threads` - Create thread
  - [ ] `POST /api/chat/threads/:id/messages` - Send message
  - [ ] `GET /api/chat/threads/:id/events` - SSE stream

- [ ] Implement SSE streaming
  - [ ] Set up EventSource response
  - [ ] Stream OpenAI chunks
  - [ ] Handle connection management

- [ ] Add chat history
  - [ ] Save messages to database
  - [ ] Retrieve conversation history
  - [ ] Implement message pagination

### 23. Chat Frontend

- [ ] Update ChatPanel component
  - [ ] Remove mock response timeout
  - [ ] Implement EventSource connection
  - [ ] Add streaming message display
  - [ ] Handle connection errors

- [ ] Add chat API functions
  - [ ] createThread()
  - [ ] sendMessage()
  - [ ] subscribeToStream()

- [ ] Persist chat history
  - [ ] Load previous messages
  - [ ] Auto-save conversations
  - [ ] Clear chat functionality

---

## Success Criteria

### ✅ Phase 4 Complete When:
- [ ] All mock functions removed from SolveProblemsPage
- [ ] Solutions generate using real AI
- [ ] Hints generate using real AI
- [ ] Concept notes generate using real AI
- [ ] All components display AI-generated content
- [ ] Error handling works properly
- [ ] Response times < 20 seconds
- [ ] No console errors
- [ ] All manual tests pass

### ✅ Phase 6 Complete When:
- [ ] Chat uses real AI responses
- [ ] SSE streaming works
- [ ] Chat history persists
- [ ] Multiple chat threads supported
- [ ] Error handling works

---

## Estimated Timeline

| Phase | Tasks | Duration | Dependencies |
|-------|-------|----------|--------------|
| 4A: OpenAI Service | 1-6 | 2-3 days | None |
| 4B: Backend Endpoints | 7-11 | 2-3 days | 4A complete |
| 4C: Frontend Integration | 12-18 | 3-4 days | 4B complete |
| 4D: Testing | 19-21 | 2-3 days | 4C complete |
| 4E: Deployment | 22-24 | 1-2 days | 4D complete |
| **Total Phase 4** | | **10-15 days** | |
| Phase 6: Chat | 25-30 | 5-7 days | Phase 4 complete |

---

## Risk Register

| Risk | Severity | Mitigation | Status |
|------|----------|-----------|--------|
| OpenAI rate limits | High | Implement queue + backoff | ⏳ Pending |
| High token costs | Medium | Optimize prompts, cache | ⏳ Pending |
| Slow responses | Medium | Use mini model default | ⏳ Pending |
| Malformed responses | High | Robust validation | ⏳ Pending |
| API key exposure | Critical | Env vars only | ✅ Mitigated |

---

## Notes

- **API Key Security**: Never commit OPENAI_API_KEY to git
- **Cost Management**: Monitor token usage daily during rollout
- **Testing**: Test each endpoint independently before integration
- **Rollout**: Consider feature flag for gradual rollout
- **Monitoring**: Set up alerts for error rates > 5%

---

## Contact

For questions or issues during implementation:
- Review: `docs/ai-integration-architecture.md`
- Backend Spec: `docs/backend-spec.md`
- Frontend Spec: `docs/frontend-spec.md`
