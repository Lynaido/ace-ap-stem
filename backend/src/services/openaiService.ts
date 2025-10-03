import OpenAI from 'openai';
import config from '../config/environment';
import logger from '../config/logger';

// Initialize OpenAI client
if (!config.openaiApiKey) {
  logger.warn('OPENAI_API_KEY is not set. AI variant generation will not work.');
}

const DEFAULT_OPENAI_TIMEOUT_MS = Math.max(config.openaiTimeoutMs || 60000, 1000);
const CONCEPT_NOTES_TIMEOUT_MS = Math.max(config.openaiConceptNotesTimeoutMs || DEFAULT_OPENAI_TIMEOUT_MS, 1000);

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
  timeout: DEFAULT_OPENAI_TIMEOUT_MS,
  maxRetries: 3, // Allow an extra retry for transient errors
});

const isAbortOrTimeoutError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message?.toLowerCase?.() ?? '';
  return (
    error.name === 'AbortError' ||
    message.includes('abort') ||
    message.includes('timeout') ||
    message.includes('fetch failed due to')
  );
};

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
    
    const model = selectModel({ taskType: 'variants' });

    const completion = await openai.chat.completions.create({
      model, // Using the cost-effective GPT-5 Nano model for variant generation
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
      max_completion_tokens: 2000,
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
    return 'gpt-4o'; // Using GPT-4o for complex tasks
  }

  // Task-based routing with actual GPT models
  switch (taskType) {
    case 'variants':
      return 'gpt-4o-mini'; // Most cost-effective for variants

    case 'hints':
      return 'gpt-4o-mini'; // Mini for hints generation

    case 'concepts':
      return 'gpt-4o-mini'; // Mini handles concept extraction well

    case 'chat':
      return 'gpt-4o-mini'; // Mini for conversational responses

    case 'solution':
      // Difficulty-based routing for solutions
      if (difficulty === 'hard' || difficulty === 'very-hard') {
        return 'gpt-4o'; // GPT-4o for complex problems
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
      max_completion_tokens: 3000,
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
      max_completion_tokens: 2000,
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

// Generate concept notes with fallback mechanism
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

    // Use flagship model for concept notes to ensure quality
    const model = selectModel({ difficulty, subject, taskType: 'concepts' });

    const prompt = createConceptNotesPrompt(problemText, subject, difficulty, options);

    const completion = await openai.chat.completions.create(
      {
        model,
        messages: [
          {
            role: 'system',
            content: `You are an expert ${subject} educator creating comprehensive, educational concept notes. Your goal is to provide students with deep understanding of the concepts needed to solve problems independently. Focus on clarity, practical applications, and building strong foundational knowledge.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: 3000, // Increased for more comprehensive content
      },
      {
        timeout: CONCEPT_NOTES_TIMEOUT_MS
      }
    );

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response content from OpenAI');
    }

    const conceptNotes = parseConceptNotesResponse(responseContent, subject, difficulty);

    logger.info('Successfully generated concept notes', { noteCount: conceptNotes.conceptNotes.length });

    return conceptNotes;
  } catch (error) {
    logger.error('Error generating concept notes:', error);

    // Handle specific error types with fallback
    if (isAbortOrTimeoutError(error)) {
      logger.warn('Enhanced concept notes failed or timed out, attempting fallback method');
      return await generateConceptNotesFallback(params);
    }

    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        throw new Error('API rate limit reached. Please wait a moment and try again.');
      }
      if (error.message.includes('insufficient_quota')) {
        throw new Error('API quota exceeded. Please check your OpenAI usage limits.');
      }
    }

    throw new Error(`Failed to generate concept notes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Fallback concept notes generation with simpler prompts
const generateConceptNotesFallback = async (params: {
  problemText: string;
  subject: string;
  difficulty?: string;
  options?: any;
}): Promise<ConceptNotesResponse> => {
  const { problemText, subject, difficulty = 'medium' } = params;

  try {
    logger.info('Generating fallback concept notes with OpenAI', { subject, difficulty });

    const model = 'gpt-5-mini'; // Use mini model for fallback

    const fallbackPrompt = `Create 2-3 basic concept notes for this ${subject} problem:

**Problem:** ${problemText}

**Task:** Generate simple concept notes explaining the key concepts needed to solve this problem.

**Each note should include:**
- id: unique identifier
- type: definition or formula
- title: concept name
- description: brief summary
- content: short explanation

**JSON Format:**
\`\`\`json
{
  "conceptNotes": [
    {
      "id": "concept-1",
      "type": "definition",
      "title": "Concept Name",
      "description": "Brief summary",
      "content": "Short explanation of the concept."
    }
  ],
  "subject": "${subject}",
  "difficulty": "${difficulty}"
}
\`\`\``;

    const completion = await openai.chat.completions.create(
      {
        model,
        messages: [
          {
            role: 'system',
            content: `You are a ${subject} educator creating simple study notes.`
          },
          {
            role: 'user',
            content: fallbackPrompt
          }
        ],
        max_completion_tokens: 1500, // Reduced token limit for fallback
      },
      {
        timeout: Math.min(CONCEPT_NOTES_TIMEOUT_MS, DEFAULT_OPENAI_TIMEOUT_MS)
      }
    );

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response content from OpenAI fallback');
    }

    const conceptNotes = parseConceptNotesResponse(responseContent, subject, difficulty);

    logger.info('Successfully generated fallback concept notes', { noteCount: conceptNotes.conceptNotes.length });

    return conceptNotes;
  } catch (fallbackError) {
    logger.error('Fallback concept notes also failed:', fallbackError);
    throw new Error(`Failed to generate concept notes: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
  }
};

const createConceptNotesPrompt = (problemText: string, subject: string, difficulty: string, options?: any): string => {
  let optionsPrompt = '';
  if (options) {
    if (options.focusAreas) {
      optionsPrompt += `\nFocus on: ${options.focusAreas.join(', ')}`;
    }
    if (options.depthLevel) {
      optionsPrompt += `\nDepth: ${options.depthLevel}`;
    }
  }

  return `Create comprehensive educational concept notes for this ${subject} problem:

**Problem:** ${problemText}

**Task:** Generate 4-6 detailed concept notes covering all essential theories, formulas, and concepts needed to understand and solve this problem independently.${optionsPrompt}

**Requirements:**
1. **Multiple Note Types**: Include definitions, formulas, examples, tips, common mistakes, and applications
2. **Educational Depth**: Each note should provide thorough understanding, not just surface-level explanations
3. **Practical Application**: Show how each concept applies specifically to this problem
4. **Progressive Learning**: Structure notes to build understanding from fundamentals to advanced applications
5. **Rich Content**: Include formulas with variable explanations, step-by-step derivations, real-world applications, and common pitfalls

**Each note must include:**
- **id**: Unique identifier
- **type**: definition, formula, example, tip, common-mistake, or application
- **title**: Clear, descriptive concept name
- **description**: 2-3 sentence summary that explains the concept's relevance
- **content**: Detailed explanation (200-400 words) covering:
  * Core principle and definition
  * Mathematical formulation (when applicable)
  * Step-by-step reasoning process
  * Common applications and real-world examples
  * Potential mistakes or misconceptions
  * Tips for problem-solving application

**Enhanced JSON Format:**
\`\`\`json
{
  "conceptNotes": [
    {
      "id": "power-definition",
      "type": "definition",
      "title": "Power in Physics",
      "description": "Power is a fundamental concept in physics that measures the rate of energy transfer or work done. Understanding power is crucial for analyzing systems that involve energy conversion over time, such as electrical circuits, mechanical systems, and thermal processes.",
      "content": "Power represents how quickly work is done or energy is transferred in a system. In mathematical terms, power P is defined as the rate of change of work W with respect to time t, expressed as P = dW/dt. This concept is essential for understanding energy efficiency, system performance, and time-dependent processes. For example, a 100-watt light bulb converts electrical energy to light and heat energy at a rate of 100 joules per second. Common units include watts (joules/second), horsepower, and kilowatts. When solving problems, remember that power can be calculated as P = F × v (force times velocity) for mechanical systems or P = I²R (current squared times resistance) for electrical systems. Students often confuse power with energy - remember that energy is the total amount transferred, while power describes how fast that transfer occurs."
    },
    {
      "id": "power-formula",
      "type": "formula",
      "title": "Power Formulas and Applications",
      "description": "Multiple formulas exist for calculating power depending on the available information and the physical context. These formulas allow conversion between different forms of energy and work measurements.",
      "content": "The fundamental power formula is P = W/t, where W is work and t is time. For mechanical systems, P = F × v, where F is force and v is velocity. In electrical systems, P = V × I (voltage times current) or P = I²R = V²/R. Each formula serves different scenarios: use P = Fv for constant force problems, P = VI for basic electrical calculations, and P = I²R when resistance is known. Variable meanings: P (watts), W (joules), t (seconds), F (newtons), v (m/s), V (volts), I (amperes), R (ohms). When deriving these formulas, start from the definition P = dW/dt and substitute appropriate work expressions. Common mistake: forgetting to convert units (e.g., horsepower to watts). Application tip: In circuits, use P = I²R when current is constant, P = V²/R when voltage is constant.",
      "formula": "P = W/t | P = F×v | P = V×I | P = I²R | P = V²/R",
      "variables": [
        {"symbol": "P", "meaning": "Power in watts"},
        {"symbol": "W", "meaning": "Work in joules"},
        {"symbol": "t", "meaning": "Time in seconds"},
        {"symbol": "F", "meaning": "Force in newtons"},
        {"symbol": "v", "meaning": "Velocity in m/s"},
        {"symbol": "V", "meaning": "Voltage in volts"},
        {"symbol": "I", "meaning": "Current in amperes"},
        {"symbol": "R", "meaning": "Resistance in ohms"}
      ]
    },
    {
      "id": "power-example",
      "type": "example",
      "title": "Calculating Power Example",
      "description": "A practical example demonstrating how to calculate power using work and time measurements, showing the step-by-step process for determining power in a mechanical system.",
      "content": "Consider a crane lifting a 500 kg load to a height of 20 meters in 40 seconds. To find the power developed by the crane motor: Step 1 - Calculate work done: W = mgh = 500 × 9.8 × 20 = 98,000 joules. Step 2 - Apply power formula: P = W/t = 98,000 / 40 = 2,450 watts. This means the crane motor must provide at least 2,450 watts of power, though actual power would be higher due to efficiency losses. Real-world application: Construction cranes are rated by their power capacity - a 10-ton crane might need 50,000+ watts for heavy lifting. Common mistake: Forgetting that power requirements increase with faster lifting speeds. Problem-solving tip: Always check if the calculated power seems reasonable for the application - 2,450 watts is about 3.3 horsepower, which is typical for small construction equipment.",
      "examples": [
        "Crane lifting 500kg load 20m in 40s: P = (500×9.8×20)/40 = 2,450W",
        "Light bulb: P = V×I = 120V × 0.5A = 60W",
        "Car engine: 200 horsepower = 149,140W of mechanical power"
      ]
    }
  ],
  "subject": "${subject}",
  "difficulty": "${difficulty}"
}
\`\`\`

**Guidelines:**
- Create notes that build conceptual understanding progressively
- Include specific problem-solving strategies and tips
- Explain common mistakes and how to avoid them
- Provide context for when and why each concept matters
- Use clear, educational language suitable for AP-level students`;
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
