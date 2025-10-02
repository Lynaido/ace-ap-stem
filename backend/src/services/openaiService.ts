import OpenAI from 'openai';
import config from '../config/environment';
import logger from '../config/logger';

// Initialize OpenAI client
if (!config.openaiApiKey) {
  logger.warn('OPENAI_API_KEY is not set. AI variant generation will not work.');
}

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export interface ProblemVariant {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimatedTime: number;
  hints: string[];
}

export interface GenerateVariantsParams {
  originalProblem: {
    title: string;
    description: string;
    subject: string;
    difficulty: string;
  };
  studyMode: string;
  variantCount?: number;
}

// Solution generation interfaces
export interface SolutionStep {
  stepNumber: number;
  title: string;
  content: string;
  explanation: string;
  formula?: string;
  calculation?: string;
}

export interface SolutionResponse {
  steps: SolutionStep[];
  finalAnswer: string;
  confidence: number;
  methodology: string;
  assumptions?: string[];
  verificationSteps?: string[];
}

// Hint interfaces
export interface Hint {
  type: 'conceptual' | 'procedural' | 'diagnostic' | 'answer';
  text: string;
  explanation: string;
  relatedConcepts?: string[];
  isAnswer?: boolean;
}

export interface HintsResponse {
  hints: Hint[];
  progressionStrategy: string;
}

// Concept Note interfaces
export interface ConceptNote {
  id: string;
  type: 'definition' | 'formula' | 'example' | 'tip' | 'common-mistake' | 'application';
  title: string;
  description: string;
  content: string;
  formula?: string;
  variables?: { symbol: string; meaning: string }[];
  examples?: string[];
  relatedTopics?: string[];
}

export interface ConceptNotesResponse {
  conceptNotes: ConceptNote[];
  subject: string;
  difficulty: string;
}

// Model selection types
export type ModelTier = 'nano' | 'mini' | 'flagship';

export interface ModelSelectionParams {
  difficulty?: string;
  subject?: string;
  taskType: 'solution' | 'hints' | 'concepts' | 'chat' | 'variants';
  escalate?: boolean;
}

export const generateProblemVariants = async (params: GenerateVariantsParams): Promise<ProblemVariant[]> => {
  const { originalProblem, studyMode, variantCount = 3 } = params;
  
  try {
    // Check if API key is configured
    if (!config.openaiApiKey) {
      logger.error('OPENAI_API_KEY is not configured');
      throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.');
    }

    logger.info('Generating problem variants with OpenAI', { 
      studyMode, 
      subject: originalProblem.subject,
      variantCount 
    });

    const prompt = createVariantPrompt(originalProblem, studyMode, variantCount);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using the cost-effective model for variant generation
      messages: [
        {
          role: 'system',
          content: 'You are an expert AP STEM educator who creates practice problem variants to help students master concepts through deliberate practice.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response content from OpenAI');
    }

    const variants = parseVariantsResponse(responseContent);
    
    if (variants.length === 0) {
      throw new Error('Failed to parse any valid variants from OpenAI response');
    }

    logger.info('Successfully generated problem variants', { 
      generatedCount: variants.length,
      studyMode 
    });

    return variants;
  } catch (error) {
    logger.error('Error generating problem variants:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('OpenAI API key is invalid or not configured properly.');
      }
      if (error.message.includes('quota')) {
        throw new Error('OpenAI API quota exceeded. Please check your usage limits.');
      }
      if (error.message.includes('rate limit')) {
        throw new Error('OpenAI API rate limit reached. Please try again in a moment.');
      }
    }
    
    throw new Error(`Failed to generate variants: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const createVariantPrompt = (problem: GenerateVariantsParams['originalProblem'], studyMode: string, count: number): string => {
  return `Create ${count} practice problem variants based on this original problem:

**Original Problem:**
Title: ${problem.title}
Description: ${problem.description}
Subject: ${problem.subject}
Difficulty: ${problem.difficulty}

**Study Mode:** ${studyMode}

**Requirements:**
1. Each variant should test the same core concepts but with different scenarios, numbers, or contexts
2. Maintain the same difficulty level: ${problem.difficulty}
3. Ensure variants are appropriate for ${problem.subject}
4. Each variant should take approximately 10-15 minutes to solve
5. Include 2-3 helpful hints for each variant

**Response Format (JSON):**
\`\`\`json
[
  {
    "id": "variant-1",
    "title": "Brief descriptive title",
    "description": "Complete problem statement with all necessary information",
    "difficulty": "${problem.difficulty}",
    "estimatedTime": 12,
    "hints": [
      "First hint that guides students toward the approach",
      "Second hint that provides a key insight",
      "Third hint that helps with common mistakes"
    ]
  }
]
\`\`\`

Focus on creating variants that help students practice the core concepts while building confidence through varied applications.`;
};

const parseVariantsResponse = (response: string): ProblemVariant[] => {
  try {
    // Extract JSON from the response (in case it's wrapped in markdown)
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonContent = jsonMatch ? jsonMatch[1] : response;
    
    const parsed = JSON.parse(jsonContent);
    
    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }

    return parsed.map((variant: any, index: number) => ({
      id: variant.id || `variant-${index + 1}`,
      title: variant.title || `Practice Variant ${index + 1}`,
      description: variant.description || '',
      difficulty: variant.difficulty || 'medium',
      estimatedTime: variant.estimatedTime || 10,
      hints: Array.isArray(variant.hints) ? variant.hints : []
    }));
  } catch (error) {
    logger.error('Error parsing variants response:', error);
    
    // Fallback: return a basic variant if parsing fails
    return [];
  }
};

// Model selection utility
export const selectModel = (params: ModelSelectionParams): string => {
  const { difficulty, taskType, escalate } = params;

  // If escalation requested, use flagship model
  if (escalate) {
    return 'gpt-4o';
  }

  // Task-based routing
  switch (taskType) {
    case 'variants':
      return 'gpt-4o-mini'; // Cost-effective for variants
    
    case 'hints':
      return 'gpt-4o-mini'; // Mini is good for hints
    
    case 'concepts':
      return 'gpt-4o-mini'; // Mini handles concept extraction well
    
    case 'chat':
      return 'gpt-4o-mini'; // Mini for conversational responses
    
    case 'solution':
      // Difficulty-based routing for solutions
      if (difficulty === 'hard' || difficulty === 'very-hard') {
        return 'gpt-4o'; // Flagship for complex problems
      }
      return 'gpt-4o-mini'; // Mini for easy/medium problems
    
    default:
      return 'gpt-4o-mini';
  }
};

// Generate step-by-step solution
export const generateSolution = async (params: {
  problemText: string;
  subject: string;
  difficulty?: string;
  imageContext?: string;
}): Promise<SolutionResponse> => {
  const { problemText, subject, difficulty = 'medium', imageContext } = params;

  try {
    if (!config.openaiApiKey) {
      logger.error('OPENAI_API_KEY is not configured');
      throw new Error('OpenAI API key is not configured');
    }

    logger.info('Generating solution with OpenAI', { subject, difficulty });

    const model = selectModel({ difficulty, subject, taskType: 'solution' });
    
    const prompt = createSolutionPrompt(problemText, subject, difficulty, imageContext);

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are an expert ${subject} tutor who provides clear, step-by-step solutions to AP-level problems. Break down complex problems into manageable steps with detailed explanations.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent solutions
      max_tokens: 3000,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response content from OpenAI');
    }

    const solution = parseSolutionResponse(responseContent);
    
    logger.info('Successfully generated solution', { 
      stepCount: solution.steps.length,
      confidence: solution.confidence 
    });

    return solution;
  } catch (error) {
    logger.error('Error generating solution:', error);
    throw new Error(`Failed to generate solution: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const createSolutionPrompt = (problemText: string, subject: string, difficulty: string, imageContext?: string): string => {
  return `Solve this ${subject} problem step-by-step:

**Problem:**
${problemText}

${imageContext ? `**Visual Context:**\n${imageContext}\n` : ''}

**Subject:** ${subject}
**Difficulty:** ${difficulty}

**Requirements:**
1. Break the solution into clear, numbered steps (4-8 steps typically)
2. Each step should have:
   - A descriptive title
   - The main content/action
   - A clear explanation of WHY this step is needed
   - Formulas used (if applicable)
   - Calculations (if applicable)
3. Provide the final answer clearly
4. Include your confidence level (0.0-1.0) based on problem clarity and solution certainty
5. State your methodology (e.g., "kinematic equations", "stoichiometry", "logarithmic differentiation")

**Response Format (JSON):**
\`\`\`json
{
  "steps": [
    {
      "stepNumber": 1,
      "title": "Identify Given Information",
      "content": "Extract and list all given values...",
      "explanation": "We need to organize the known values before proceeding...",
      "formula": "v = u + at (if applicable)",
      "calculation": "calculation details (if applicable)"
    }
  ],
  "finalAnswer": "The final answer with units",
  "confidence": 0.95,
  "methodology": "Brief description of approach used",
  "assumptions": ["List any assumptions made"],
  "verificationSteps": ["Optional verification methods"]
}
\`\`\``;
};

const parseSolutionResponse = (response: string): SolutionResponse => {
  try {
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonContent = jsonMatch ? jsonMatch[1] : response;
    
    const parsed = JSON.parse(jsonContent);
    
    return {
      steps: parsed.steps || [],
      finalAnswer: parsed.finalAnswer || 'Solution completed',
      confidence: parsed.confidence || 0.85,
      methodology: parsed.methodology || 'Standard problem-solving approach',
      assumptions: parsed.assumptions || [],
      verificationSteps: parsed.verificationSteps || []
    };
  } catch (error) {
    logger.error('Error parsing solution response:', error);
    throw new Error('Failed to parse solution from OpenAI response');
  }
};

// Generate progressive hints
export const generateHints = async (params: {
  problemText: string;
  subject: string;
  difficulty?: string;
  options?: any;
}): Promise<HintsResponse> => {
  const { problemText, subject, difficulty = 'medium', options } = params;

  try {
    if (!config.openaiApiKey) {
      logger.error('OPENAI_API_KEY is not configured');
      throw new Error('OpenAI API key is not configured');
    }

    logger.info('Generating hints with OpenAI', { subject, difficulty });

    const model = selectModel({ difficulty, subject, taskType: 'hints' });
    
    const prompt = createHintsPrompt(problemText, subject, difficulty, options);

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are a patient ${subject} tutor who provides progressive hints that guide students to discover solutions themselves. Each hint should reveal just enough to help without giving away the complete answer.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 2000,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response content from OpenAI');
    }

    const hints = parseHintsResponse(responseContent);
    
    logger.info('Successfully generated hints', { hintCount: hints.hints.length });

    return hints;
  } catch (error) {
    logger.error('Error generating hints:', error);
    throw new Error(`Failed to generate hints: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const createHintsPrompt = (problemText: string, subject: string, difficulty: string, options?: any): string => {
  const numberOfHints = options?.numberOfHints || '4-5';

  let optionsPrompt = '';
  if (options) {
    if (options.progressionType) {
      optionsPrompt += `\n- The hint progression should be ${options.progressionType}`;
    }
  }

  return `Create a progressive hint sequence for this ${subject} problem:

**Problem:**
${problemText}

**Subject:** ${subject}
**Difficulty:** ${difficulty}

**Requirements:**
1. Create ${numberOfHints} hints that progressively reveal the solution path
2. First hints should be conceptual (what concepts/principles apply?)
3. Middle hints should be procedural (what steps/approach to take?)
4. Later hints can be more specific (calculations, formulas)
5. Final hint should reveal the complete answer
6. Each hint needs:
   - Type: conceptual, procedural, diagnostic, or answer
   - Text: The hint itself
   - Explanation: Why this hint is helpful
   - Related concepts (optional)

**Response Format (JSON):**
\`\`\`json
{
  "hints": [
    {
      "type": "conceptual",
      "text": "Consider which fundamental principle applies here...",
      "explanation": "This hint directs attention to the core concept",
      "relatedConcepts": ["Newton's Laws", "Conservation of Energy"]
    },
    {
      "type": "answer",
      "text": "The complete solution is...",
      "explanation": "Full answer for students who need it",
      "isAnswer": true
    }
  ],
  "progressionStrategy": "Brief description of the pedagogical progression used"
}
\`\`\``;
};

const parseHintsResponse = (response: string): HintsResponse => {
  try {
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonContent = jsonMatch ? jsonMatch[1] : response;
    
    const parsed = JSON.parse(jsonContent);
    
    return {
      hints: parsed.hints || [],
      progressionStrategy: parsed.progressionStrategy || 'Progressive scaffolding from concepts to procedures'
    };
  } catch (error) {
    logger.error('Error parsing hints response:', error);
    throw new Error('Failed to parse hints from OpenAI response');
  }
};

// Generate concept notes
export const generateConceptNotes = async (params: {
  problemText: string;
  subject: string;
  difficulty?: string;
  options?: any;
}): Promise<ConceptNotesResponse> => {
  const { problemText, subject, difficulty = 'medium', options } = params;

  try {
    if (!config.openaiApiKey) {
      logger.error('OPENAI_API_KEY is not configured');
      throw new Error('OpenAI API key is not configured');
    }

    logger.info('Generating concept notes with OpenAI', { subject, difficulty });

    const model = selectModel({ difficulty, subject, taskType: 'concepts' });
    
    const prompt = createConceptNotesPrompt(problemText, subject, difficulty, options);

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are a ${subject} educator who creates comprehensive study notes that help students understand the concepts behind problems. Focus on clear explanations, formulas, examples, and practical tips.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.4,
      max_tokens: 3000,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response content from OpenAI');
    }

    const conceptNotes = parseConceptNotesResponse(responseContent, subject, difficulty);
    
    logger.info('Successfully generated concept notes', { noteCount: conceptNotes.conceptNotes.length });

    return conceptNotes;
  } catch (error) {
    logger.error('Error generating concept notes:', error);
    throw new Error(`Failed to generate concept notes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const createConceptNotesPrompt = (problemText: string, subject: string, difficulty: string, options?: any): string => {
  let optionsPrompt = '';
  if (options) {
    if (options.focusAreas) {
      optionsPrompt += `\n- Focus specifically on these areas: ${options.focusAreas.join(', ')}`;
    }
    if (options.depthLevel) {
      optionsPrompt += `\n- Adjust the depth to be ${options.depthLevel}`;
    }
  }

  return `Create comprehensive concept notes for this ${subject} problem:

**Problem:**
${problemText}

**Subject:** ${subject}
**Difficulty:** ${difficulty}

**Requirements:**${optionsPrompt}
1. Identify 4-6 key concepts relevant to solving this problem
2. For each concept, provide:
   - Type: definition, formula, example, tip, common-mistake, or application
   - Title: Concise name
   - Description: One-sentence summary
   - Content: Detailed explanation
   - Formula (if applicable): Mathematical expression
   - Variables (if applicable): Symbol definitions
   - Examples: Practical examples
   - Related topics: Connected concepts

**Response Format (JSON):**
\`\`\`json
{
  "conceptNotes": [
    {
      "id": "concept-1",
      "type": "definition",
      "title": "Concept Name",
      "description": "Brief one-sentence summary",
      "content": "Detailed explanation of the concept...",
      "formula": "F = ma (if applicable)",
      "variables": [
        { "symbol": "F", "meaning": "Force in Newtons" }
      ],
      "examples": ["Example 1: ...", "Example 2: ..."],
      "relatedTopics": ["Related Concept 1", "Related Concept 2"]
    }
  ],
  "subject": "${subject}",
  "difficulty": "${difficulty}"
}
\`\`\`

Focus on concepts that would help students solve similar problems in the future.`;
};

const parseConceptNotesResponse = (response: string, subject: string, difficulty: string): ConceptNotesResponse => {
  try {
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonContent = jsonMatch ? jsonMatch[1] : response;
    
    const parsed = JSON.parse(jsonContent);
    
    return {
      conceptNotes: parsed.conceptNotes || [],
      subject: parsed.subject || subject,
      difficulty: parsed.difficulty || difficulty
    };
  } catch (error) {
    logger.error('Error parsing concept notes response:', error);
    throw new Error('Failed to parse concept notes from OpenAI response');
  }
};

export default {
  generateProblemVariants,
  generateSolution,
  generateHints,
  generateConceptNotes,
  selectModel
};
