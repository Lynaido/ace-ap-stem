# AI Integration Architecture & Implementation Guide

**Date:** October 3, 2025  
**Status:** Comprehensive Analysis for Phase 4 Implementation  
**Purpose:** Detailed mapping of AI integration to replace mock data with real AI-powered features

---

## Executive Summary

This document provides an in-depth analysis of how AI will be integrated into the AAS platform, identifying all mock data locations, defining the AI service architecture, and mapping the exact implementation path for seamless frontend integration without bugs.

### Current State
- ✅ Authentication & Database fully integrated
- ✅ Problems & file uploads working
- ✅ Study Mode variants using real AI (GPT-4o-mini)
- ❌ **Problem Solutions using MOCK data**
- ❌ **Hints using MOCK data**
- ❌ **Concept Notes using MOCK data**
- ❌ **Chat responses using MOCK data**

---

## 1. Mock Data Identification

### 1.1 SolveProblemsPage - Primary Mock Location
**File:** `src/pages/SolveProblemsPage.js`

#### Mock Functions Found:
```javascript
// Line 104-140
const createMockSolution = () => ({
  steps: [
    { id: 1, title: 'Understand the Problem', content: '...', explanation: '...' },
    { id: 2, title: 'Identify Key Information', content: '...', explanation: '...' },
    { id: 3, title: 'Plan Your Approach', content: '...', explanation: '...' },
    { id: 4, title: 'Execute Systematically', content: '...', explanation: '...' },
    { id: 5, title: 'Check and Reflect', content: '...', explanation: '...' }
  ],
  finalAnswer: 'The structured solution confirms the result...',
  confidence: 0.95,
});

// Line 141-163
const createMockHints = (subjectLabel) => ([
  { type: 'Problem Scan', text: '...', explanation: '...' },
  { type: 'Strategy Hint', text: '...', explanation: '...' },
  { type: 'Step Hint', text: '...', explanation: '...' },
  { isAnswer: true, text: '...', explanation: '...' }
]);

// Line 164-199
const createMockConceptNotes = (subjectLabel) => ([
  { id: 'concept-1', type: 'concept', title: 'Essential Theories', description: '...', details: '...', relatedTopics: [] },
  { id: 'concept-2', type: 'formula', title: 'Anchor Relationships', description: '...', formula: '...', applications: [] },
  { id: 'concept-3', type: 'example', title: 'Worked Analogy', description: '...', details: '...' },
  { id: 'concept-4', type: 'tip', title: 'Learning Tip', description: '...', applications: [] }
]);
```

#### Current Mock Usage Pattern:
```javascript
// Line 290-315 - handleSolveProblem
const handleSolveProblem = async () => {
  // Creates problem in DB ✅
  await createProblem(problemData, folderId);
  
  // BUT: Shows mock solution immediately ❌
  // No AI generation triggered
  // No job creation
  // No polling for results
};
```

### 1.2 ChatPanel - Mock Chat Responses
**File:** `src/components/chat/ChatPanel.js`

```javascript
// Line 46-53 - Mock AI response with setTimeout
setTimeout(() => {
  const aiResponse = {
    id: messages.length + 2,
    text: `This is a mock AI response to "${inputValue}".`,
    sender: 'ai',
    timestamp: new Date(),
  };
  setMessages((prevMessages) => [...prevMessages, aiResponse]);
}, 1000);
```

---

## 2. Required AI Service Architecture

### 2.1 OpenAI Service Expansion
**File:** `backend/src/services/openaiService.ts` (Currently 175 lines)

#### Current Implementation:
- ✅ OpenAI client initialized
- ✅ `generateProblemVariants()` working
- ❌ Missing: Solution generation
- ❌ Missing: Hints generation
- ❌ Missing: Concept notes generation
- ❌ Missing: Chat streaming

#### Required New Functions:

```typescript
// 1. SOLUTION GENERATION
export interface SolutionStep {
  id: number;
  title: string;
  content: string;
  explanation: string;
  mathExpression?: string;
}

export interface SolutionResponse {
  steps: SolutionStep[];
  finalAnswer: string;
  confidence: number;
  sources?: string[];
  verificationResult?: {
    method: 'sympy' | 'wolfram' | 'none';
    verified: boolean;
    details?: string;
  };
}

export interface GenerateSolutionParams {
  problem: {
    title: string;
    description: string;
    subject: string;
    difficulty: string;
    imageUrl?: string;
  };
  modelTier?: 'nano' | 'mini' | 'flagship';
  includeVerification?: boolean;
}

export const generateSolution = async (params: GenerateSolutionParams): Promise<SolutionResponse>;

// 2. HINTS GENERATION
export interface Hint {
  type: string;
  text: string;
  explanation: string;
  isAnswer?: boolean;
  order: number;
}

export interface GenerateHintsParams {
  problem: {
    title: string;
    description: string;
    subject: string;
    difficulty: string;
  };
  hintCount?: number;
}

export const generateHints = async (params: GenerateHintsParams): Promise<Hint[]>;

// 3. CONCEPT NOTES GENERATION
export interface ConceptNote {
  id: string;
  type: 'concept' | 'formula' | 'example' | 'tip';
  title: string;
  description: string;
  details?: string;
  formula?: string;
  relatedTopics?: string[];
  applications?: string[];
  difficulty?: string;
}

export interface GenerateConceptNotesParams {
  problem: {
    title: string;
    description: string;
    subject: string;
    difficulty: string;
  };
}

export const generateConceptNotes = async (params: GenerateConceptNotesParams): Promise<ConceptNote[]>;

// 4. CHAT STREAMING
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: any;
}

export interface ChatStreamParams {
  messages: ChatMessage[];
  problemContext?: {
    title: string;
    description: string;
    subject: string;
  };
  onChunk?: (chunk: string) => void;
}

export const generateChatResponse = async (params: ChatStreamParams): Promise<string>;
```

### 2.2 Model Tier Routing Strategy

```typescript
// Model selection logic
export const selectModel = (
  taskType: 'solution' | 'hints' | 'concepts' | 'chat' | 'variants',
  difficulty?: string,
  escalate?: boolean
): string => {
  if (escalate) return 'gpt-4o'; // Flagship for escalations
  
  switch (taskType) {
    case 'solution':
      return difficulty === 'hard' ? 'gpt-4o' : 'gpt-4o-mini';
    case 'hints':
      return 'gpt-4o-mini';
    case 'concepts':
      return 'gpt-4o-mini';
    case 'chat':
      return 'gpt-4o-mini'; // Fast responses
    case 'variants':
      return 'gpt-4o-mini'; // Already implemented
    default:
      return 'gpt-4o-mini';
  }
};
```

---

## 3. Backend API Endpoints to Create

### 3.1 Solution Generation Endpoint
**Route:** `POST /api/problems/:id/solutions`

```typescript
// File: backend/src/controllers/problemsController.ts
export const generateSolution = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { modelTier = 'mini', includeVerification = false } = req.body;

    // 1. Fetch problem
    const problem = await prisma.problem.findFirst({
      where: { id, userId },
      include: { assets: true }
    });

    if (!problem) {
      res.status(404).json({ success: false, error: 'Problem not found' });
      return;
    }

    // 2. Create AI job record
    const aiJob = await prisma.aiJob.create({
      data: {
        type: 'SOLUTION',
        status: 'PENDING',
        input: {
          problemId: id,
          title: problem.title,
          description: problem.description,
          subject: problem.subject,
          difficulty: problem.difficulty,
          modelTier,
          includeVerification
        }
      }
    });

    // 3. Enqueue BullMQ job (or process immediately for now)
    // Option A: Process immediately (simpler, no BullMQ yet)
    const solution = await openaiService.generateSolution({
      problem: {
        title: problem.title,
        description: problem.description,
        subject: problem.subject,
        difficulty: problem.difficulty
      },
      modelTier,
      includeVerification
    });

    // 4. Update job status
    await prisma.aiJob.update({
      where: { id: aiJob.id },
      data: {
        status: 'COMPLETED',
        output: solution
      }
    });

    // 5. Create Solution record
    const solutionRecord = await prisma.solution.create({
      data: {
        problemId: id,
        content: JSON.stringify(solution.steps),
        confidence: solution.confidence,
        sources: solution.sources || [],
        steps: solution.steps,
        finalAnswer: solution.finalAnswer
      }
    });

    // 6. Update problem status
    await prisma.problem.update({
      where: { id },
      data: { status: 'SOLVED' }
    });

    res.status(200).json({
      success: true,
      data: {
        jobId: aiJob.id,
        solution: solutionRecord
      }
    });

  } catch (error) {
    logger.error('Error generating solution:', error);
    res.status(500).json({ success: false, error: 'Failed to generate solution' });
  }
};
```

### 3.2 Hints Generation Endpoint
**Route:** `POST /api/problems/:id/hints`

```typescript
export const generateHints = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { hintCount = 4 } = req.body;

    const problem = await prisma.problem.findFirst({
      where: { id, userId }
    });

    if (!problem) {
      res.status(404).json({ success: false, error: 'Problem not found' });
      return;
    }

    // Create AI job
    const aiJob = await prisma.aiJob.create({
      data: {
        type: 'HINT',
        status: 'PROCESSING',
        input: { problemId: id, hintCount }
      }
    });

    // Generate hints
    const hints = await openaiService.generateHints({
      problem: {
        title: problem.title,
        description: problem.description,
        subject: problem.subject,
        difficulty: problem.difficulty
      },
      hintCount
    });

    // Store each hint
    const hintRecords = await Promise.all(
      hints.map((hint, index) =>
        prisma.hint.create({
          data: {
            problemId: id,
            content: JSON.stringify({
              type: hint.type,
              text: hint.text,
              explanation: hint.explanation,
              isAnswer: hint.isAnswer,
              order: index + 1
            })
          }
        })
      )
    );

    await prisma.aiJob.update({
      where: { id: aiJob.id },
      data: { status: 'COMPLETED', output: hints }
    });

    res.status(200).json({
      success: true,
      data: {
        jobId: aiJob.id,
        hints: hintRecords
      }
    });

  } catch (error) {
    logger.error('Error generating hints:', error);
    res.status(500).json({ success: false, error: 'Failed to generate hints' });
  }
};
```

### 3.3 Concept Notes Endpoint
**Route:** `POST /api/problems/:id/concept-notes`

```typescript
export const generateConceptNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const problem = await prisma.problem.findFirst({
      where: { id, userId }
    });

    if (!problem) {
      res.status(404).json({ success: false, error: 'Problem not found' });
      return;
    }

    const aiJob = await prisma.aiJob.create({
      data: {
        type: 'CONCEPT_NOTE',
        status: 'PROCESSING',
        input: { problemId: id }
      }
    });

    const conceptNotes = await openaiService.generateConceptNotes({
      problem: {
        title: problem.title,
        description: problem.description,
        subject: problem.subject,
        difficulty: problem.difficulty
      }
    });

    const conceptNoteRecords = await Promise.all(
      conceptNotes.map(note =>
        prisma.conceptNote.create({
          data: {
            problemId: id,
            title: note.title,
            content: JSON.stringify({
              type: note.type,
              description: note.description,
              details: note.details,
              formula: note.formula,
              relatedTopics: note.relatedTopics,
              applications: note.applications
            })
          }
        })
      )
    );

    await prisma.aiJob.update({
      where: { id: aiJob.id },
      data: { status: 'COMPLETED', output: conceptNotes }
    });

    res.status(200).json({
      success: true,
      data: {
        jobId: aiJob.id,
        conceptNotes: conceptNoteRecords
      }
    });

  } catch (error) {
    logger.error('Error generating concept notes:', error);
    res.status(500).json({ success: false, error: 'Failed to generate concept notes' });
  }
};
```

### 3.4 Job Status Polling Endpoint
**Route:** `GET /api/jobs/:id`

```typescript
// File: backend/src/controllers/jobsController.ts
export const getJobStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const job = await prisma.aiJob.findUnique({
      where: { id }
    });

    if (!job) {
      res.status(404).json({ success: false, error: 'Job not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: job.id,
        type: job.type,
        status: job.status,
        output: job.output,
        error: job.error,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt
      }
    });

  } catch (error) {
    logger.error('Error fetching job status:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch job status' });
  }
};
```

---

## 4. Frontend Integration Plan

### 4.1 Update API Client
**File:** `src/utils/api.js`

Add new API methods:

```javascript
export const problemAPI = {
  // Existing methods...
  getAll: () => apiClient.get('/api/problems'),
  getById: (id) => apiClient.get(`/api/problems/${id}`),
  create: (problemData) => apiClient.post('/api/problems', problemData),
  update: (id, problemData) => apiClient.put(`/api/problems/${id}`, problemData),
  delete: (id) => apiClient.delete(`/api/problems/${id}`),
  
  // NEW: AI Generation endpoints
  generateSolution: (id, options = {}) => 
    apiClient.post(`/api/problems/${id}/solutions`, options),
  generateHints: (id, options = {}) => 
    apiClient.post(`/api/problems/${id}/hints`, options),
  generateConceptNotes: (id, options = {}) => 
    apiClient.post(`/api/problems/${id}/concept-notes`, options),
};

export const jobAPI = {
  getStatus: (jobId) => apiClient.get(`/api/jobs/${jobId}`),
};
```

### 4.2 Update AppContext
**File:** `src/context/AppContext.js`

Add AI generation actions:

```javascript
// NEW action types
const ActionTypes = {
  // ... existing actions
  
  // AI Generation actions
  START_AI_GENERATION: 'START_AI_GENERATION',
  AI_GENERATION_SUCCESS: 'AI_GENERATION_SUCCESS',
  AI_GENERATION_FAILED: 'AI_GENERATION_FAILED',
  SET_AI_JOB_STATUS: 'SET_AI_JOB_STATUS',
};

// NEW state fields
const initialState = {
  // ... existing state
  
  // AI generation state
  currentAIJob: null,
  aiJobStatus: null, // 'pending', 'processing', 'completed', 'failed'
  generationError: null,
};

// NEW reducer cases
case ActionTypes.START_AI_GENERATION:
  return {
    ...state,
    currentAIJob: action.payload,
    aiJobStatus: 'pending',
    generationError: null,
    loading: true
  };

case ActionTypes.AI_GENERATION_SUCCESS:
  return {
    ...state,
    aiJobStatus: 'completed',
    loading: false,
    activeSolution: action.payload.solution || state.activeSolution,
    activeHints: action.payload.hints || state.activeHints,
    activeConceptNotes: action.payload.conceptNotes || state.activeConceptNotes,
  };

case ActionTypes.AI_GENERATION_FAILED:
  return {
    ...state,
    aiJobStatus: 'failed',
    generationError: action.payload,
    loading: false
  };

// NEW action functions
const generateAISolution = useCallback(async (problemId, options = {}) => {
  try {
    dispatch({ type: ActionTypes.START_AI_GENERATION, payload: { type: 'solution' } });
    
    const response = await problemAPI.generateSolution(problemId, options);
    const { jobId, solution } = response.data;
    
    // Poll job status if needed
    if (jobId) {
      await pollJobStatus(jobId, 'solution');
    }
    
    dispatch({ 
      type: ActionTypes.AI_GENERATION_SUCCESS, 
      payload: { solution } 
    });
    
    toast.success('Solution generated successfully!');
    return solution;
    
  } catch (error) {
    dispatch({ 
      type: ActionTypes.AI_GENERATION_FAILED, 
      payload: error.message 
    });
    toast.error(`Failed to generate solution: ${error.message}`);
    throw error;
  }
}, []);

const generateAIHints = useCallback(async (problemId, options = {}) => {
  try {
    dispatch({ type: ActionTypes.START_AI_GENERATION, payload: { type: 'hints' } });
    
    const response = await problemAPI.generateHints(problemId, options);
    const { hints } = response.data;
    
    // Transform hints to match component expected format
    const transformedHints = hints.map(hint => {
      const content = JSON.parse(hint.content);
      return {
        type: content.type,
        text: content.text,
        explanation: content.explanation,
        isAnswer: content.isAnswer
      };
    });
    
    dispatch({ 
      type: ActionTypes.AI_GENERATION_SUCCESS, 
      payload: { hints: transformedHints } 
    });
    
    toast.success('Hints generated successfully!');
    return transformedHints;
    
  } catch (error) {
    dispatch({ 
      type: ActionTypes.AI_GENERATION_FAILED, 
      payload: error.message 
    });
    toast.error(`Failed to generate hints: ${error.message}`);
    throw error;
  }
}, []);

const generateAIConceptNotes = useCallback(async (problemId, options = {}) => {
  try {
    dispatch({ type: ActionTypes.START_AI_GENERATION, payload: { type: 'concepts' } });
    
    const response = await problemAPI.generateConceptNotes(problemId, options);
    const { conceptNotes } = response.data;
    
    // Transform concept notes to match component expected format
    const transformedNotes = conceptNotes.map(note => {
      const content = JSON.parse(note.content);
      return {
        id: note.id,
        type: content.type,
        title: note.title,
        description: content.description,
        details: content.details,
        formula: content.formula,
        relatedTopics: content.relatedTopics || [],
        applications: content.applications || []
      };
    });
    
    dispatch({ 
      type: ActionTypes.AI_GENERATION_SUCCESS, 
      payload: { conceptNotes: transformedNotes } 
    });
    
    toast.success('Concept notes generated successfully!');
    return transformedNotes;
    
  } catch (error) {
    dispatch({ 
      type: ActionTypes.AI_GENERATION_FAILED, 
      payload: error.message 
    });
    toast.error(`Failed to generate concept notes: ${error.message}`);
    throw error;
  }
}, []);

// Helper function for job polling
const pollJobStatus = async (jobId, type, maxAttempts = 30, interval = 2000) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await jobAPI.getStatus(jobId);
    const { status, output, error } = response.data;
    
    if (status === 'COMPLETED') {
      return output;
    } else if (status === 'FAILED') {
      throw new Error(error || 'Job failed');
    }
    
    // Update UI with current status
    dispatch({ 
      type: ActionTypes.SET_AI_JOB_STATUS, 
      payload: { status, attempt: attempt + 1, maxAttempts } 
    });
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error('Job polling timeout');
};

// Export in actions
const actions = {
  // ... existing actions
  
  // AI generation actions
  generateAISolution,
  generateAIHints,
  generateAIConceptNotes,
};
```

### 4.3 Update SolveProblemsPage
**File:** `src/pages/SolveProblemsPage.js`

Replace mock functions with real AI calls:

```javascript
// REMOVE these mock functions:
// - createMockSolution()
// - createMockHints()
// - createMockConceptNotes()

// UPDATE button handlers
const { 
  createProblem, 
  generateAISolution,    // NEW
  generateAIHints,       // NEW
  generateAIConceptNotes, // NEW
  loading, 
  error 
} = useAppContext();

// Line 290 - UPDATE handleSolveProblem
const handleSolveProblem = async () => {
  if (formIncomplete) return;

  setActiveView('solution');
  setIsSolving(true);
  setShowSolution(true);

  try {
    // 1. Create problem in database
    const problemData = {
      title: `${trimmedProblem.substring(0, 50)}...`,
      description: trimmedProblem,
      subject: selectedSubject,
      difficulty: 'medium',
      imageUrl: uploadedAsset?.url
    };

    const folderId = new URLSearchParams(location.search).get('folderId');
    const createdProblem = await createProblem(problemData, folderId);
    
    // 2. Trigger AI solution generation
    const solution = await generateAISolution(createdProblem.id, {
      modelTier: 'mini',
      includeVerification: false
    });
    
    // 3. Solution is now in context state, component will auto-update
    // The activeSolution state will trigger SolutionDisplay to render
    
    if (isCreateMode) {
      setTimeout(() => {
        navigate('/notes-hub?refresh=true', { replace: true });
      }, 2000);
    }

  } catch (error) {
    console.error('Error solving problem:', error);
    toast.error('Failed to generate solution');
  } finally {
    setIsSolving(false);
  }
};

// UPDATE handleGenerateHints
const handleGenerateHints = async () => {
  if (formIncomplete) return;

  setActiveView('hints');
  setIsGeneratingHints(true);
  setShowSolution(true);

  try {
    // Create problem first if needed
    let problemId = currentProblem?.id;
    
    if (!problemId) {
      const problemData = {
        title: `${trimmedProblem.substring(0, 50)}...`,
        description: trimmedProblem,
        subject: selectedSubject,
        difficulty: 'medium'
      };
      const created = await createProblem(problemData);
      problemId = created.id;
    }
    
    // Generate real hints
    await generateAIHints(problemId, { hintCount: 4 });
    
  } catch (error) {
    console.error('Error generating hints:', error);
  } finally {
    setIsGeneratingHints(false);
  }
};

// UPDATE handleGenerateConceptNotes
const handleGenerateConceptNotes = async () => {
  if (formIncomplete) return;

  setActiveView('concepts');
  setIsGeneratingConceptNotes(true);
  setShowSolution(true);

  try {
    let problemId = currentProblem?.id;
    
    if (!problemId) {
      const problemData = {
        title: `${trimmedProblem.substring(0, 50)}...`,
        description: trimmedProblem,
        subject: selectedSubject,
        difficulty: 'medium'
      };
      const created = await createProblem(problemData);
      problemId = created.id;
    }
    
    // Generate real concept notes
    await generateAIConceptNotes(problemId);
    
  } catch (error) {
    console.error('Error generating concept notes:', error);
  } finally {
    setIsGeneratingConceptNotes(false);
  }
};

// UPDATE the rendering section to show real data
{activeView === 'solution' && activeSolution && (
  <SolutionDisplay 
    solution={activeSolution} 
    problemText={trimmedProblem} 
  />
)}

{activeView === 'hints' && activeHints && activeHints.length > 0 && (
  <HintsDisplay 
    hints={activeHints} 
    problemText={trimmedProblem} 
  />
)}

{activeView === 'concepts' && activeConceptNotes && activeConceptNotes.length > 0 && (
  <ConceptNotesDisplay 
    conceptNotes={activeConceptNotes} 
    problemText={trimmedProblem} 
  />
)}
```

---

## 5. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       USER INTERACTION                           │
│              (SolveProblemsPage - Button Click)                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│                                                                  │
│  1. handleSolveProblem() called                                  │
│  2. createProblem() → API POST /api/problems                     │
│  3. generateAISolution() → API POST /api/problems/:id/solutions  │
│  4. Loading state = true, show spinner                           │
│  5. Poll job status (optional)                                   │
│  6. Receive solution data                                        │
│  7. Update context state (activeSolution)                        │
│  8. SolutionDisplay component auto-renders                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Express API)                        │
│                                                                  │
│  1. POST /api/problems/:id/solutions                             │
│  2. Authenticate user                                            │
│  3. Fetch problem from DB                                        │
│  4. Create AiJob record (status: PENDING)                        │
│  5. Call openaiService.generateSolution()                        │
│  6. Update AiJob (status: COMPLETED)                             │
│  7. Create Solution record in DB                                 │
│  8. Return solution data to frontend                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AI SERVICE (OpenAI)                            │
│                                                                  │
│  1. generateSolution() called                                    │
│  2. Select model based on difficulty                             │
│  3. Build prompt from problem data                               │
│  4. Call OpenAI API (gpt-4o or gpt-4o-mini)                      │
│  5. Parse JSON response                                          │
│  6. Validate response structure                                  │
│  7. Return structured solution object                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE (PostgreSQL)                       │
│                                                                  │
│  Tables Updated:                                                 │
│  - problems (status: SOLVED)                                     │
│  - ai_jobs (type: SOLUTION, status: COMPLETED, output: {...})   │
│  - solutions (problemId, content, steps, finalAnswer, confidence)│
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Component Data Contract

### 6.1 SolutionDisplay Component
**Expected Props:**
```javascript
{
  solution: {
    steps: [
      {
        id: number,
        title: string,
        content: string,
        explanation: string
      }
    ],
    finalAnswer: string,
    confidence: number (0-1)
  },
  problemText: string
}
```

**No Changes Needed** - Component already expects this format

### 6.2 HintsDisplay Component
**Expected Props:**
```javascript
{
  hints: [
    {
      type: string,
      text: string,
      explanation: string,
      isAnswer: boolean (optional)
    }
  ],
  problemText: string
}
```

**No Changes Needed** - Component already expects this format

### 6.3 ConceptNotesDisplay Component
**Expected Props:**
```javascript
{
  conceptNotes: [
    {
      id: string,
      type: 'concept' | 'formula' | 'example' | 'tip',
      title: string,
      description: string,
      details: string (optional),
      formula: string (optional),
      relatedTopics: string[] (optional),
      applications: string[] (optional)
    }
  ],
  problemText: string
}
```

**No Changes Needed** - Component already expects this format

---

## 7. Testing Strategy

### 7.1 Unit Tests Needed

```javascript
// backend/src/services/__tests__/openaiService.test.ts
describe('OpenAI Service', () => {
  test('generateSolution returns valid structure', async () => {
    const result = await generateSolution({
      problem: mockProblem
    });
    
    expect(result).toHaveProperty('steps');
    expect(result).toHaveProperty('finalAnswer');
    expect(result).toHaveProperty('confidence');
    expect(result.steps).toBeInstanceOf(Array);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });
  
  test('generateHints returns 4 hints by default', async () => {
    const result = await generateHints({
      problem: mockProblem
    });
    
    expect(result).toHaveLength(4);
    expect(result[0]).toHaveProperty('type');
    expect(result[0]).toHaveProperty('text');
  });
});
```

### 7.2 Integration Tests

```javascript
// Test full flow
describe('AI Generation Flow', () => {
  test('Problem → Solution generation → Display', async () => {
    // 1. Create problem
    const problem = await createProblem(testData);
    
    // 2. Generate solution
    const solution = await generateSolution(problem.id);
    
    // 3. Verify solution structure
    expect(solution.steps.length).toBeGreaterThan(0);
    
    // 4. Verify DB persistence
    const stored = await prisma.solution.findFirst({
      where: { problemId: problem.id }
    });
    expect(stored).toBeTruthy();
  });
});
```

### 7.3 Manual Testing Checklist

- [ ] Create problem with text input
- [ ] Click "Solve Problem" button
- [ ] Verify loading indicator shows
- [ ] Verify solution generates within 15 seconds
- [ ] Verify solution has 3-5 steps
- [ ] Verify step-by-step navigation works
- [ ] Verify "Show All" toggle works
- [ ] Click "Step-by-Step Hints" button
- [ ] Verify hints generate
- [ ] Verify progressive hint revealing
- [ ] Click "Generate Concept Notes" button
- [ ] Verify concept notes tabs render
- [ ] Verify formula rendering
- [ ] Test with different subjects
- [ ] Test with uploaded images
- [ ] Verify error handling for API failures
- [ ] Verify retry logic works
- [ ] Test concurrent generations

---

## 8. Error Handling & Edge Cases

### 8.1 OpenAI API Errors

```typescript
// Handle rate limits
try {
  const response = await openai.chat.completions.create(...);
} catch (error) {
  if (error.status === 429) {
    // Rate limit - retry with exponential backoff
    await sleep(retryDelay);
    return generateSolutionWithRetry(params, attempt + 1);
  } else if (error.status === 401) {
    // Invalid API key
    throw new Error('OpenAI API key is invalid');
  } else if (error.status === 500) {
    // OpenAI server error
    throw new Error('OpenAI service temporarily unavailable');
  }
  throw error;
}
```

### 8.2 Malformed AI Responses

```typescript
// Validate response structure
const validateSolutionResponse = (response: any): boolean => {
  if (!response || typeof response !== 'object') return false;
  if (!Array.isArray(response.steps)) return false;
  if (!response.finalAnswer || typeof response.finalAnswer !== 'string') return false;
  if (typeof response.confidence !== 'number') return false;
  
  // Validate each step
  for (const step of response.steps) {
    if (!step.title || !step.content) return false;
  }
  
  return true;
};
```

### 8.3 Frontend Fallbacks

```javascript
// If AI generation fails, show helpful error
if (error) {
  return (
    <Card className="error-card">
      <h3>Generation Failed</h3>
      <p>{error.message}</p>
      <Button onClick={retryGeneration}>Try Again</Button>
      <Button variant="outline" onClick={contactSupport}>
        Contact Support
      </Button>
    </Card>
  );
}

// Loading states with timeout
useEffect(() => {
  const timeout = setTimeout(() => {
    if (loading) {
      setWarning('This is taking longer than usual...');
    }
  }, 30000); // 30 seconds
  
  return () => clearTimeout(timeout);
}, [loading]);
```

---

## 9. Performance Considerations

### 9.1 Response Time Targets
- **Solution Generation:** < 15 seconds (target: 8-12s)
- **Hints Generation:** < 10 seconds (target: 5-8s)
- **Concept Notes:** < 12 seconds (target: 6-10s)
- **Chat Response:** < 3 seconds (streaming starts < 1s)

### 9.2 Caching Strategy
```typescript
// Cache frequently requested solutions
const solutionCache = new Map<string, Solution>();

export const getCachedSolution = async (problemId: string): Promise<Solution | null> => {
  // Check cache first
  if (solutionCache.has(problemId)) {
    return solutionCache.get(problemId);
  }
  
  // Check database
  const stored = await prisma.solution.findFirst({
    where: { problemId }
  });
  
  if (stored) {
    solutionCache.set(problemId, stored);
    return stored;
  }
  
  return null;
};
```

### 9.3 Token Usage Optimization
```typescript
// Optimize prompts to reduce token usage
const optimizePrompt = (problem: Problem): string => {
  // Keep description concise
  const description = problem.description.length > 500 
    ? problem.description.substring(0, 500) + '...'
    : problem.description;
  
  return `Subject: ${problem.subject}
Problem: ${description}
Difficulty: ${problem.difficulty}

Provide a structured solution with 3-5 steps.`;
};
```

---

## 10. Chat Integration (Phase 6)

### 10.1 Chat Architecture

```typescript
// Server-Sent Events setup
export const streamChatResponse = async (
  threadId: string,
  message: string,
  res: Response
): Promise<void> => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: await getThreadMessages(threadId),
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    logger.error('Chat streaming error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
};
```

### 10.2 Frontend EventSource

```javascript
// ChatPanel.js update
const handleSendMessage = async (messageText) => {
  // Send message via POST
  const response = await chatAPI.sendMessage(threadId, messageText);
  
  // Open SSE connection for streaming response
  const eventSource = new EventSource(
    `${API_BASE_URL}/api/chat/threads/${threadId}/events`
  );
  
  let aiMessage = '';
  
  eventSource.onmessage = (event) => {
    if (event.data === '[DONE]') {
      eventSource.close();
      return;
    }
    
    const { content } = JSON.parse(event.data);
    aiMessage += content;
    
    // Update UI with streaming content
    setMessages(prev => {
      const lastMsg = prev[prev.length - 1];
      if (lastMsg && lastMsg.sender === 'ai' && lastMsg.streaming) {
        return [
          ...prev.slice(0, -1),
          { ...lastMsg, text: aiMessage }
        ];
      }
      return [
        ...prev,
        { id: Date.now(), sender: 'ai', text: aiMessage, streaming: true }
      ];
    });
  };
  
  eventSource.onerror = () => {
    eventSource.close();
    toast.error('Connection lost. Please try again.');
  };
};
```

---

## 11. Implementation Roadmap

### Phase 4A: Core AI Services (Week 1)
- [ ] Extend `openaiService.ts` with solution/hints/concepts functions
- [ ] Implement model tier selection logic
- [ ] Add response validation and error handling
- [ ] Write unit tests for AI service

### Phase 4B: Backend Endpoints (Week 1-2)
- [ ] Create solution generation endpoint
- [ ] Create hints generation endpoint
- [ ] Create concept notes endpoint
- [ ] Create job status endpoint
- [ ] Add routes to server.ts
- [ ] Write integration tests

### Phase 4C: Frontend Integration (Week 2)
- [ ] Update api.js with new endpoints
- [ ] Update AppContext with AI actions
- [ ] Remove mock functions from SolveProblemsPage
- [ ] Update button handlers to call real APIs
- [ ] Add loading states and error handling
- [ ] Test full flow end-to-end

### Phase 4D: Polish & Optimization (Week 2-3)
- [ ] Add caching for repeated problems
- [ ] Optimize prompts for token usage
- [ ] Add retry logic with exponential backoff
- [ ] Implement request queuing
- [ ] Add analytics for AI usage
- [ ] Performance testing

### Phase 6: Chat Integration (Week 3-4)
- [ ] Implement chat endpoints
- [ ] Add SSE streaming
- [ ] Update ChatPanel with EventSource
- [ ] Test streaming responses
- [ ] Add chat history persistence

---

## 12. Critical Success Factors

### ✅ Must Have
1. **Response Format Matching**: AI responses MUST match the exact format expected by components
2. **Error Handling**: Graceful degradation when AI fails
3. **Loading States**: Clear feedback during generation
4. **Data Persistence**: All AI outputs saved to database
5. **Type Safety**: TypeScript interfaces for all AI responses

### ⚠️ Should Have
1. **Caching**: Avoid regenerating identical problems
2. **Retry Logic**: Automatic retry on transient failures
3. **Rate Limiting**: Prevent abuse of AI endpoints
4. **Cost Tracking**: Monitor OpenAI token usage
5. **Performance Metrics**: Track generation times

### 💡 Nice to Have
1. **Model Comparison**: A/B test different models
2. **User Feedback**: Rating system for AI responses
3. **Verification**: SymPy/Wolfram integration
4. **Multi-language**: Support for non-English problems
5. **Voice Input**: Speech-to-text for problem entry

---

## 13. Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| OpenAI API rate limits | High | Implement exponential backoff, queue system |
| Malformed AI responses | High | Robust validation, fallback to simplified prompts |
| High token costs | Medium | Optimize prompts, cache results, set usage limits |
| Slow response times | Medium | Use mini model by default, async processing |
| API key exposure | Critical | Environment variables, never commit to git |
| Database bottleneck | Low | Index frequently queried fields, connection pooling |

---

## 14. Monitoring & Metrics

### Key Metrics to Track
```typescript
interface AIMetrics {
  requestCount: number;
  successRate: number;
  averageResponseTime: number;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
  errorRate: number;
  cacheHitRate: number;
}
```

### Logging Strategy
```typescript
logger.info('AI generation started', {
  type: 'solution',
  problemId,
  userId,
  model: 'gpt-4o-mini'
});

logger.info('AI generation completed', {
  type: 'solution',
  problemId,
  duration: Date.now() - startTime,
  tokens: completion.usage.total_tokens,
  success: true
});
```

---

## Conclusion

This architecture document provides a complete blueprint for integrating AI into the AAS platform. The key principles are:

1. **Maintain Component Contracts**: AI responses must match existing mock data structures
2. **Gradual Migration**: Replace mocks one feature at a time
3. **Robust Error Handling**: Never leave users with blank screens
4. **Performance First**: Optimize for speed and cost
5. **Test Thoroughly**: Validate each integration point

By following this guide, the frontend integration will be seamless, with no component changes needed—only the data source changes from mock to real AI.

---

**Next Steps:**
1. Review this document with the team
2. Set up OpenAI API key in backend .env
3. Begin Phase 4A implementation
4. Test each endpoint thoroughly before moving to next phase
5. Monitor costs and performance closely during rollout
