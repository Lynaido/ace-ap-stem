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
  extractedProblemText?: string; // For image-only problems, extracted text from the image
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
  extractedProblemText?: string; // For image-only problems, extracted text from the image
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
  extractedProblemText?: string; // For image-only problems, extracted text from the image
}

// Problem structure detection interfaces
export interface ProblemPart {
  id: string;    // Stable identifier, e.g. "q2-a"
  label: string; // Human readable label as printed on the paper, e.g. "2(a)"
  text: string;  // The statement of this sub-part only
}

export interface ProblemQuestion {
  id: string;         // Stable identifier, e.g. "q2"
  label: string;      // Human readable label, e.g. "Question 2"
  text: string;       // Shared stem/context for the whole question
  parts: ProblemPart[]; // Empty when the question has no sub-parts
}

export interface ProblemStructureResponse {
  extractedText: string;
  hasMultipleQuestions: boolean;
  questions: ProblemQuestion[];
}

// Describes which part of the problem the student asked us to work on
export interface SolveFocus {
  scope: 'all' | 'question' | 'part';
  questionLabel?: string;
  partLabel?: string;
  focusText?: string;    // Statement of the selected question/part
  contextText?: string;  // Full problem text, kept for context
  siblingLabels?: string[]; // Labels of the other sub-parts of the same question
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
          content: 'You are an expert AP STEM educator who creates practice problem variants to help students master concepts through deliberate practice. You must respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_completion_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response content from OpenAI');
    }

    logger.info('Received variants response from OpenAI', { 
      contentLength: responseContent.length,
      firstChars: responseContent.substring(0, 100),
      lastChars: responseContent.substring(Math.max(0, responseContent.length - 50)),
      finishReason: completion.choices[0]?.finish_reason,
      model: completion.model
    });

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
5. Include 2-3 helpful hints for each variant that progressively guide students
6. Make each variant unique and challenging in different ways

**IMPORTANT: Return ONLY a JSON array (no markdown, no code fences, no explanation).**

**Required JSON Format:**
[
  {
    "id": "variant-1",
    "title": "Brief descriptive title",
    "description": "Complete problem statement with all necessary information, numbers, and context",
    "difficulty": "${problem.difficulty}",
    "estimatedTime": 12,
    "hints": [
      "First hint that guides students toward the approach",
      "Second hint that provides a key insight or formula",
      "Third hint that helps with common mistakes or calculations"
    ]
  },
  {
    "id": "variant-2",
    "title": "Different scenario title",
    "description": "Another complete problem with different numbers/context",
    "difficulty": "${problem.difficulty}",
    "estimatedTime": 12,
    "hints": [
      "Hint 1 for variant 2",
      "Hint 2 for variant 2",
      "Hint 3 for variant 2"
    ]
  }
  (continue for ${count} total variants)
]

Focus on creating variants that help students practice the core concepts while building confidence through varied applications. Each variant should be completely self-contained with all necessary information to solve it.`;
};

const extractJson = (text: string): string | null => {
  // Remove BOM and trim
  text = text.replace(/^\uFEFF/, '').trim();
  
  // If using response_format: json_object, the entire response should be JSON
  // Try parsing directly first
  if (text.startsWith('{') || text.startsWith('[')) {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');

    let start = -1;
    let end = -1;

    if (firstBrace !== -1 && lastBrace > firstBrace) {
      start = firstBrace;
      end = lastBrace;
    } else if (firstBracket !== -1 && lastBracket > firstBracket) {
      start = firstBracket;
      end = lastBracket;
    }

    if (start !== -1 && end !== -1) {
      return text.substring(start, end + 1);
    }
  }

  // Fallback: Try to find the JSON block in markdown
  const markdownMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (markdownMatch && markdownMatch[1]) {
    return markdownMatch[1].trim();
  }

  // Another fallback: find any JSON block in code fences
  const codeBlockMatch = text.match(/```\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    const content = codeBlockMatch[1].trim();
    if (content.startsWith('{') || content.startsWith('[')) {
      return content;
    }
  }

  // Last resort: find the first and last brace or bracket anywhere
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');

  let start = -1;
  let end = -1;

  if (firstBrace !== -1 && lastBrace > firstBrace) {
    start = firstBrace;
    end = lastBrace;
  } else if (firstBracket !== -1 && lastBracket > firstBracket) {
    start = firstBracket;
    end = lastBracket;
  }

  if (start !== -1 && end !== -1) {
    return text.substring(start, end + 1);
  }

  return null;
};

const parseVariantsResponse = (response: string): ProblemVariant[] => {
  logger.info('Raw variants response from OpenAI (first 500 chars):', { 
    preview: response.substring(0, 500),
    fullLength: response.length 
  });

  try {
    const jsonContent = extractJson(response);
    if (!jsonContent) {
      logger.error('No JSON content found in variants response', { 
        rawResponse: response.substring(0, 1000) 
      });
      throw new Error('No JSON content found in response.');
    }
    
    logger.info('Extracted variants JSON (first 300 chars):', {
      preview: jsonContent.substring(0, 300),
      fullLength: jsonContent.length
    });

    // Try parsing directly first (for response_format: json_object)
    let parsed;
    try {
      // Clean up common issues
      let cleanedContent = jsonContent
        .trim()
        .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]+/g, "")
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/^\uFEFF/, '');
      
      parsed = JSON.parse(cleanedContent);
      logger.info('Successfully parsed variants JSON on first attempt');
    } catch (firstError) {
      logger.warn('First variants parse attempt failed, trying additional cleaning', {
        errorMessage: firstError instanceof Error ? firstError.message : String(firstError),
        firstChars: jsonContent.substring(0, 100)
      });
      
      // Try more aggressive cleaning
      let cleanedContent = jsonContent
        .trim()
        .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]+/g, "")
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/^\uFEFF/, '')
        .replace(/\\([^"\\\/bfnrtu])/g, '\\\\$1');
      
      parsed = JSON.parse(cleanedContent);
      logger.info('Successfully parsed variants JSON after cleaning');
    }
    
    // Handle both array format and object with variants property
    let variantsArray;
    if (Array.isArray(parsed)) {
      variantsArray = parsed;
    } else if (parsed.variants && Array.isArray(parsed.variants)) {
      variantsArray = parsed.variants;
    } else {
      logger.error('Parsed variants is neither an array nor has variants property', { parsed });
      throw new Error('Response format is invalid - expected array or object with variants property');
    }

    const mappedVariants = variantsArray.map((variant: any, index: number) => ({
      id: variant.id || `variant-${index + 1}`,
      title: variant.title || `Practice Variant ${index + 1}`,
      description: variant.description || '',
      difficulty: variant.difficulty || 'medium',
      estimatedTime: variant.estimatedTime || 10,
      hints: Array.isArray(variant.hints) ? variant.hints : []
    }));

    logger.info('Successfully mapped variants', { count: mappedVariants.length });
    return mappedVariants;
  } catch (error) {
    logger.error('Error parsing variants response:', {
      errorMessage: error instanceof Error ? error.message : String(error),
      responsePreview: response.substring(0, 500)
    });
    throw new Error(`Failed to parse variants: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

// Detect the structure of a problem (questions and sub-parts) after OCR.
// Runs once right after upload so the UI can offer a "which part to solve" choice.
export const detectProblemStructure = async (params: {
  problemText: string;
  subject: string;
  imageData?: { url?: string; base64?: string; mimeType?: string }[];
}): Promise<ProblemStructureResponse> => {
  const { problemText, subject, imageData } = params;

  try {
    if (!config.openaiApiKey) {
      logger.error('OPENAI_API_KEY is not configured');
      throw new Error('OpenAI API key is not configured');
    }

    const hasImages = !!imageData?.length;
    logger.info('Detecting problem structure with OpenAI', { subject, hasImages });

    // Keep structure detection on the cost-efficient multimodal model for both
    // typed and image problems. The full generation calls still choose their
    // model independently based on task complexity.
    const model = 'gpt-4o-mini';
    const prompt = createStructurePrompt(problemText);

    const userMessage: any = hasImages
      ? {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            ...(imageData || [])
              .map(img => {
                if (img.url) {
                  return { type: 'image_url', image_url: { url: img.url } };
                }
                if (img.base64) {
                  return {
                    type: 'image_url',
                    image_url: { url: `data:${img.mimeType || 'image/jpeg'};base64,${img.base64}` }
                  };
                }
                return null;
              })
              .filter(Boolean)
          ]
        }
      : { role: 'user', content: prompt };

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are an assistant that transcribes exam problems and identifies their structure (questions and lettered sub-parts). You must respond with valid JSON only.'
        },
        userMessage
      ],
      max_completion_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response content from OpenAI');
    }

    return parseStructureResponse(responseContent, problemText);
  } catch (error) {
    logger.error('Error detecting problem structure:', error);
    // Non-fatal: fall back to treating the whole thing as a single question so the
    // normal solve/hints/concepts flow still works.
    return {
      extractedText: problemText === 'Problem from uploaded image' ? '' : problemText,
      hasMultipleQuestions: false,
      questions: []
    };
  }
};

const createStructurePrompt = (problemText: string): string => {
  const isImageOnly = problemText === 'Problem from uploaded image';
  const source = isImageOnly
    ? 'Read the problem shown in the image(s).'
    : `Here is the problem text:\n\n${problemText}`;

  return `${source}

Your job is to (1) transcribe the full problem text and (2) break it into its structure.

Rules for structure:
- A "question" is a top-level numbered item (e.g. "Question 1", "Question 2", "Câu 2"). Use its number as printed.
- A "part" is a lettered/roman sub-item inside a question (e.g. "2(a)", "2(b)", "(i)", "(ii)").
- If the whole thing is really just ONE question with no sub-parts, return a single question with an empty "parts" array and set "hasMultipleQuestions" to false.
- Only set "hasMultipleQuestions" to true when there is genuinely more than one question OR at least one question that has 2+ sub-parts. A single simple problem must NOT be split artificially.
- Preserve any shared context/stem of a question in the question's "text", and put only the specific ask of each sub-part in that part's "text".
- "label" must match what a student sees on the paper (e.g. "Question 2", "2(a)"). Keep it short.
- "id" is a slug you invent: "q2" for question 2, "q2-a" for part 2(a).

**Return ONLY this JSON object (no markdown, no code fences):**
{
  "extractedText": "The complete transcribed problem text",
  "hasMultipleQuestions": true,
  "questions": [
    {
      "id": "q2",
      "label": "Question 2",
      "text": "Shared context/stem for question 2 (may be empty)",
      "parts": [
        { "id": "q2-a", "label": "2(a)", "text": "Statement of part (a) only" },
        { "id": "q2-b", "label": "2(b)", "text": "Statement of part (b) only" }
      ]
    }
  ]
}`;
};

const parseStructureResponse = (
  response: string,
  originalText: string
): ProblemStructureResponse => {
  const jsonContent = extractJson(response);
  if (!jsonContent) {
    logger.warn('No JSON content found in structure response; treating as single question');
    return {
      extractedText: originalText === 'Problem from uploaded image' ? '' : originalText,
      hasMultipleQuestions: false,
      questions: []
    };
  }

  try {
    const cleaned = jsonContent
      .trim()
      .replace(/[\u0000-\u0008\u000b-\u000c\u000e-\u001f\u007f]+/g, '')
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/^﻿/, '');
    const parsed = JSON.parse(cleaned);

    const rawQuestions: any[] = Array.isArray(parsed.questions) ? parsed.questions : [];
    const questions: ProblemQuestion[] = rawQuestions.map((q: any, qi: number) => {
      const rawParts: any[] = Array.isArray(q.parts) ? q.parts : [];
      const parts: ProblemPart[] = rawParts.map((p: any, pi: number) => ({
        id: String(p.id || `q${qi + 1}-p${pi + 1}`),
        label: String(p.label || `Part ${pi + 1}`),
        text: String(p.text || '')
      }));
      return {
        id: String(q.id || `q${qi + 1}`),
        label: String(q.label || `Question ${qi + 1}`),
        text: String(q.text || ''),
        parts
      };
    });

    // Decide "multiple" ourselves rather than trusting the flag blindly.
    const totalParts = questions.reduce((sum, q) => sum + q.parts.length, 0);
    const hasMultiple = questions.length > 1 || totalParts >= 2;

    return {
      extractedText: String(parsed.extractedText || originalText || ''),
      hasMultipleQuestions: hasMultiple,
      questions
    };
  } catch (error) {
    logger.error('Error parsing structure response:', {
      errorMessage: error instanceof Error ? error.message : String(error)
    });
    return {
      extractedText: originalText === 'Problem from uploaded image' ? '' : originalText,
      hasMultipleQuestions: false,
      questions: []
    };
  }
};

// Build a focus instruction block that steers solve/hints/concepts toward the
// specific question or sub-part the student selected.
const buildFocusInstruction = (focus?: SolveFocus): string => {
  if (!focus || focus.scope === 'all') {
    // Whole question (or whole problem): solve every sub-part in order.
    if (focus?.scope === 'all' && focus.questionLabel && focus.siblingLabels?.length) {
      return `\n\n**FOCUS INSTRUCTION:**
The student wants the ENTIRE ${focus.questionLabel} solved. Solve every sub-part in order (${focus.siblingLabels.join(
        ' → '
      )}). Address each sub-part explicitly and label it, carrying results forward between sub-parts as needed.`;
    }
    return '';
  }

  if (focus.scope === 'question') {
    return `\n\n**FOCUS INSTRUCTION:**
Solve ONLY ${focus.questionLabel || 'the selected question'}. Ignore any other questions in the problem.${
      focus.focusText ? `\n\nThe selected question is:\n${focus.focusText}` : ''
    }`;
  }

  // scope === 'part'
  const siblings =
    focus.siblingLabels && focus.siblingLabels.length
      ? ` The same question also contains ${focus.siblingLabels.join(
          ', '
        )}, but you must NOT solve those in full.`
      : '';
  return `\n\n**FOCUS INSTRUCTION:**
Focus ONLY on ${focus.partLabel || 'the selected sub-part'}${
    focus.questionLabel ? ` of ${focus.questionLabel}` : ''
  }. Do not solve the other sub-parts.${siblings}
If ${focus.partLabel || 'this sub-part'} depends on a result from an earlier sub-part, you may compute just the intermediate result you need to proceed — briefly and clearly — rather than requiring the student to have solved the earlier part first. Keep the earlier work minimal; the deliverable is the solution to ${
    focus.partLabel || 'the selected sub-part'
  }.${focus.focusText ? `\n\nThe selected sub-part is:\n${focus.focusText}` : ''}${
    focus.contextText ? `\n\nFull problem for context (do not solve all of it):\n${focus.contextText}` : ''
  }`;
};

// Generate step-by-step solution
export const generateSolution = async (params: {
  problemText: string;
  subject: string;
  difficulty?: string;
  imageContext?: string;
  imageData?: { url?: string; base64?: string; mimeType?: string }[];
  focus?: SolveFocus;
}): Promise<SolutionResponse> => {
  const { problemText, subject, difficulty = 'medium', imageContext, imageData, focus } = params;

  try {
    if (!config.openaiApiKey) {
      logger.error('OPENAI_API_KEY is not configured');
      throw new Error('OpenAI API key is not configured');
    }

    logger.info('Generating solution with OpenAI', { subject, difficulty, hasImages: !!imageData?.length });

    const model = selectModel({ difficulty, subject, taskType: 'solution' });
    
    // If we have images, use vision-capable model
    const hasImages = imageData && imageData.length > 0;
    const visionModel = hasImages ? 'gpt-4o' : model;
    
    const prompt = createSolutionPrompt(problemText, subject, difficulty, imageContext) + buildFocusInstruction(focus);

    // Solving a whole multi-part question needs more room so the answer isn't truncated.
    const solveWholeQuestion = focus?.scope === 'all' && (focus.siblingLabels?.length || 0) > 1;
    const maxTokens = solveWholeQuestion ? 6000 : 3000;

    // Build messages with image support
    const userMessage: any = hasImages ? {
      role: 'user',
      content: [
        {
          type: 'text',
          text: prompt
        },
        ...(imageData || []).map(img => {
          if (img.url) {
            return {
              type: 'image_url',
              image_url: { url: img.url }
            };
          } else if (img.base64) {
            return {
              type: 'image_url',
              image_url: { url: `data:${img.mimeType || 'image/jpeg'};base64,${img.base64}` }
            };
          }
          return null;
        }).filter(Boolean)
      ]
    } : {
      role: 'user',
      content: prompt
    };

    const completion = await openai.chat.completions.create({
      model: visionModel,
      messages: [
        {
          role: 'system',
          content: `You are an expert ${subject} tutor who provides clear, step-by-step solutions to AP-level problems. Break down complex problems into manageable steps with detailed explanations. ${hasImages ? 'Analyze any images provided carefully and extract all relevant information from them.' : ''} You must respond with valid JSON only.`
        },
        userMessage
      ],
      max_completion_tokens: maxTokens,
      response_format: { type: "json_object" },
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
  // If problem text is generic (indicating image-only), adjust the prompt
  const isImageOnly = problemText === 'Problem from uploaded image';
  const problemDescription = isImageOnly 
    ? 'Analyze the image(s) provided and solve the problem shown.'
    : problemText;
  
  return `Solve this ${subject} problem step-by-step:

**Problem:**
${problemDescription}

${imageContext ? `**Visual Context:**\n${imageContext}\n` : ''}

**Subject:** ${subject}
**Difficulty:** ${difficulty}

**Requirements:**
1. ${isImageOnly ? 'IMPORTANT: Extract and include the complete problem statement from the image as "extractedProblemText" in your response.\n2. ' : ''}Break the solution into clear, numbered steps (4-8 steps typically)
${isImageOnly ? '3' : '2'}. Each step should have:
   - A descriptive title
   - The main content/action. Wrap all mathematical expressions, formulas, and symbols in $ for inline math and $$ for block math.
   - A clear explanation of WHY this step is needed. Wrap all mathematical expressions, formulas, and symbols in $ for inline math and $$ for block math.
   - Formulas used (if applicable). Wrap all mathematical expressions, formulas, and symbols in $ for inline math and $$ for block math.
   - Calculations (if applicable). Wrap all mathematical expressions, formulas, and symbols in $ for inline math and $$ for block math.
${isImageOnly ? '4' : '3'}. Provide the final answer clearly. Wrap all mathematical expressions, formulas, and symbols in $ for inline math and $$ for block math.
${isImageOnly ? '5' : '4'}. Include your confidence level (0.0-1.0) based on problem clarity and solution certainty
${isImageOnly ? '6' : '5'}. State your methodology (e.g., "kinematic equations", "stoichiometry", "logarithmic differentiation")

**Response Format (JSON):**
\`\`\`json
{${isImageOnly ? '\n  "extractedProblemText": "Complete problem statement from the image",' : ''}
  "steps": [
    {
      "stepNumber": 1,
      "title": "Identify Given Information",
      "content": "Extract and list all given values, for example, the initial velocity is $v_0 = 0$ m/s.",
      "explanation": "We need to organize the known values before proceeding. This helps in applying the formula $v = u + at$.",
      "formula": "$$v = u + at$$",
      "calculation": "$$v = 0 + (9.8)(2) = 19.6$$ m/s"
    }
  ],
  "finalAnswer": "The final answer is $19.6$ m/s.",
  "confidence": 0.95,
  "methodology": "Brief description of approach used",
  "assumptions": ["List any assumptions made"],
  "verificationSteps": ["Optional verification methods"]
}
\`\`\``;
};

const parseSolutionResponse = (response: string): SolutionResponse => {
  const jsonContent = extractJson(response);
  if (!jsonContent) {
    logger.error('Error parsing solution response: No JSON content found.', { rawResponse: response });
    return {
      steps: [{ stepNumber: 1, title: 'Error', content: 'Failed to find JSON in the AI response.', explanation: 'The AI response was malformed.' }],
      finalAnswer: 'An error occurred while generating the solution.',
      confidence: 0,
      methodology: 'Error handling'
    };
  }

  try {
    // Improved cleaning to handle response_format: json_object
    let parsed;
    try {
      let cleanedContent = jsonContent
        .trim()
        .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]+/g, "")
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/^\uFEFF/, '');
      
      parsed = JSON.parse(cleanedContent);
    } catch (firstError) {
      logger.warn('First solution parse attempt failed, trying additional cleaning', {
        errorMessage: firstError instanceof Error ? firstError.message : String(firstError)
      });
      
      let cleanedContent = jsonContent
        .trim()
        .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]+/g, "")
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/^\uFEFF/, '')
        .replace(/\\([^"\\\/bfnrtu])/g, '\\\\$1');
      
      parsed = JSON.parse(cleanedContent);
    }
    
    if (!parsed.steps || !Array.isArray(parsed.steps)) {
      logger.warn('Parsed solution is missing a "steps" array.', { parsed });
      return {
        steps: [],
        finalAnswer: parsed.finalAnswer || 'Could not parse steps, but final answer is available.',
        confidence: parsed.confidence || 0.5,
        methodology: parsed.methodology || 'Unknown',
        assumptions: parsed.assumptions || [],
        verificationSteps: parsed.verificationSteps || []
      };
    }

    return {
      steps: parsed.steps || [],
      finalAnswer: parsed.finalAnswer || 'Solution completed',
      confidence: parsed.confidence || 0.85,
      methodology: parsed.methodology || 'Standard problem-solving approach',
      assumptions: parsed.assumptions || [],
      verificationSteps: parsed.verificationSteps || [],
      extractedProblemText: parsed.extractedProblemText
    };
  } catch (error) {
    logger.error('Error parsing solution JSON:', { 
      errorMessage: error instanceof Error ? error.message : String(error),
      jsonContent
    });
    return {
      steps: [{
        stepNumber: 1,
        title: 'Error',
        content: 'Failed to parse the AI response. The response was not valid JSON.',
        explanation: 'This is a fallback message due to a system error.'
      }],
      finalAnswer: 'An error occurred while generating the solution.',
      confidence: 0,
      methodology: 'Error handling'
    };
  }
};

// Generate progressive hints
export const generateHints = async (params: {
  problemText: string;
  subject: string;
  difficulty?: string;
  options?: any;
  imageData?: { url?: string; base64?: string; mimeType?: string }[];
  focus?: SolveFocus;
}): Promise<HintsResponse> => {
  const { problemText, subject, difficulty = 'medium', options, imageData, focus } = params;

  try {
    if (!config.openaiApiKey) {
      logger.error('OPENAI_API_KEY is not configured');
      throw new Error('OpenAI API key is not configured');
    }

    logger.info('Generating hints with OpenAI', { subject, difficulty, hasImages: !!imageData?.length });

    const model = selectModel({ difficulty, subject, taskType: 'hints' });
    
    // If we have images, use vision-capable model
    const hasImages = imageData && imageData.length > 0;
    const visionModel = hasImages ? 'gpt-4o' : model;
    
    const prompt = createHintsPrompt(problemText, subject, difficulty, options) + buildFocusInstruction(focus);

    // Build messages with image support
    const userMessage: any = hasImages ? {
      role: 'user',
      content: [
        {
          type: 'text',
          text: prompt
        },
        ...(imageData || []).map(img => {
          if (img.url) {
            return {
              type: 'image_url',
              image_url: { url: img.url }
            };
          } else if (img.base64) {
            return {
              type: 'image_url',
              image_url: { url: `data:${img.mimeType || 'image/jpeg'};base64,${img.base64}` }
            };
          }
          return null;
        }).filter(Boolean)
      ]
    } : {
      role: 'user',
      content: prompt
    };

    const completion = await openai.chat.completions.create({
      model: visionModel,
      messages: [
        {
          role: 'system',
          content: `You are a patient ${subject} tutor who provides progressive hints that guide students to discover solutions themselves. Each hint should reveal just enough to help without giving away the complete answer. ${hasImages ? 'Analyze any images provided carefully and extract all relevant information from them.' : ''} You must respond with valid JSON only.`
        },
        userMessage
      ],
      max_completion_tokens: 2000,
      response_format: { type: "json_object" },
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

  // If problem text is generic (indicating image-only), adjust the prompt
  const isImageOnly = problemText === 'Problem from uploaded image';
  const problemDescription = isImageOnly 
    ? 'Analyze the image(s) provided and identify the problem to solve.'
    : problemText;

  return `Create a progressive hint sequence for this ${subject} problem:

**Problem:**
${problemDescription}

**Subject:** ${subject}
**Difficulty:** ${difficulty}

**Requirements:**
1. ${isImageOnly ? 'IMPORTANT: Extract and include the complete problem statement from the image as "extractedProblemText" in your response.\n2. ' : ''}Create ${numberOfHints} hints that progressively reveal the solution path
${isImageOnly ? '3' : '2'}. First hints should be conceptual (what concepts/principles apply?)
${isImageOnly ? '4' : '3'}. Middle hints should be procedural (what steps/approach to take?)
${isImageOnly ? '5' : '4'}. Later hints can be more specific (calculations, formulas)
${isImageOnly ? '6' : '5'}. Final hint should reveal the complete answer
${isImageOnly ? '7' : '6'}. Each hint needs:
   - Type: conceptual, procedural, diagnostic, or answer
   - Text: The hint itself. Wrap all mathematical expressions, formulas, and symbols in $ for inline math and $$ for block math.
   - Explanation: Why this hint is helpful. Wrap all mathematical expressions, formulas, and symbols in $ for inline math and $$ for block math.
   - Related concepts (optional)

**Response Format (JSON):**
\`\`\`json
{${isImageOnly ? '\n  "extractedProblemText": "Complete problem statement from the image",' : ''}
  "hints": [
    {
      "type": "conceptual",
      "text": "Consider which fundamental principle applies here, like the conservation of energy: $E_i = E_f$",
      "explanation": "This hint directs attention to the core concept. The equation for conservation of energy is $E_i = E_f$.",
      "relatedConcepts": ["Newton's Laws", "Conservation of Energy"]
    },
    {
      "type": "answer",
      "text": "The complete solution is $v = \\sqrt{2gh}$.",
      "explanation": "Full answer for students who need it",
      "isAnswer": true
    }
  ],
  "progressionStrategy": "Brief description of the pedagogical progression used"
}
\`\`\``;
};

const parseHintsResponse = (response: string): HintsResponse => {
  const jsonContent = extractJson(response);
  if (!jsonContent) {
    logger.error('Error parsing hints response: No JSON content found.', { rawResponse: response });
    return {
      hints: [{ type: 'diagnostic', text: 'Failed to parse hints from AI response.', explanation: 'System error.' }],
      progressionStrategy: 'Error'
    };
  }

  try {
    // Improved cleaning to handle response_format: json_object
    let parsed;
    try {
      let cleanedContent = jsonContent
        .trim()
        .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]+/g, "")
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/^\uFEFF/, '');
      
      parsed = JSON.parse(cleanedContent);
    } catch (firstError) {
      logger.warn('First hints parse attempt failed, trying additional cleaning', {
        errorMessage: firstError instanceof Error ? firstError.message : String(firstError)
      });
      
      let cleanedContent = jsonContent
        .trim()
        .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]+/g, "")
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/^\uFEFF/, '')
        .replace(/\\([^"\\\/bfnrtu])/g, '\\\\$1');
      
      parsed = JSON.parse(cleanedContent);
    }
    
    return {
      hints: parsed.hints || [],
      progressionStrategy: parsed.progressionStrategy || 'Progressive scaffolding from concepts to procedures',
      extractedProblemText: parsed.extractedProblemText
    };
  } catch (error) {
    logger.error('Error parsing hints JSON:', {
      errorMessage: error instanceof Error ? error.message : String(error),
      jsonContent
    });
    return {
      hints: [{ type: 'diagnostic', text: 'Failed to parse hints from AI response.', explanation: 'The JSON was malformed.' }],
      progressionStrategy: 'Error'
    };
  }
};

// Generate concept notes with fallback mechanism
export const generateConceptNotes = async (params: {
  problemText: string;
  subject: string;
  difficulty?: string;
  options?: any;
  imageData?: { url?: string; base64?: string; mimeType?: string }[];
  focus?: SolveFocus;
}): Promise<ConceptNotesResponse> => {
  const { problemText, subject, difficulty = 'medium', options, imageData, focus } = params;

  try {
    if (!config.openaiApiKey) {
      logger.error('OPENAI_API_KEY is not configured');
      throw new Error('OpenAI API key is not configured');
    }

    logger.info('Generating concept notes with OpenAI', { subject, difficulty, hasImages: !!imageData?.length });

    // Use flagship model for concept notes to ensure quality
    const model = selectModel({ difficulty, subject, taskType: 'concepts' });
    
    // If we have images, use vision-capable model
    const hasImages = imageData && imageData.length > 0;
    const visionModel = hasImages ? 'gpt-4o' : model;

    const prompt = createConceptNotesPrompt(problemText, subject, difficulty, options) + buildFocusInstruction(focus);

    // Build messages with image support
    const userMessage: any = hasImages ? {
      role: 'user',
      content: [
        {
          type: 'text',
          text: prompt
        },
        ...(imageData || []).map(img => {
          if (img.url) {
            return {
              type: 'image_url',
              image_url: { url: img.url }
            };
          } else if (img.base64) {
            return {
              type: 'image_url',
              image_url: { url: `data:${img.mimeType || 'image/jpeg'};base64,${img.base64}` }
            };
          }
          return null;
        }).filter(Boolean)
      ]
    } : {
      role: 'user',
      content: prompt
    };

    const completion = await openai.chat.completions.create(
      {
        model: visionModel,
        messages: [
          {
            role: 'system',
            content: `You are an expert ${subject} educator creating comprehensive, educational concept notes. Your goal is to provide students with deep understanding of the concepts needed to solve problems independently. Focus on clarity, practical applications, and building strong foundational knowledge. ${hasImages ? 'Analyze any images provided carefully and extract all relevant information from them.' : ''} You must respond with valid JSON only.`
          },
          userMessage
        ],
        max_completion_tokens: 4000, // Increased for comprehensive 5-7 notes with detailed content
        response_format: { type: "json_object" }, // Ensure valid JSON response
      },
      {
        timeout: CONCEPT_NOTES_TIMEOUT_MS
      }
    );

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response content from OpenAI');
    }

    logger.info('Received response from OpenAI', { 
      contentLength: responseContent.length,
      firstChars: responseContent.substring(0, 100),
      lastChars: responseContent.substring(Math.max(0, responseContent.length - 50)),
      finishReason: completion.choices[0]?.finish_reason,
      model: completion.model
    });

    // Check for common issues in the response
    if (responseContent.length < 10) {
      logger.error('Response content is suspiciously short', { responseContent });
      throw new Error('Received incomplete response from OpenAI');
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
  imageData?: { url?: string; base64?: string; mimeType?: string }[];
  focus?: SolveFocus;
}): Promise<ConceptNotesResponse> => {
  const { problemText, subject, difficulty = 'medium', imageData, focus } = params;

  try {
    logger.info('Generating fallback concept notes with OpenAI', { subject, difficulty });

    const model = 'gpt-4o-mini'; // Use mini model for fallback

    const fallbackPrompt = `Create 2-3 basic concept notes for this ${subject} problem:

**Problem:** ${problemText}

**Task:** Generate simple concept notes explaining the key concepts needed to solve this problem.${buildFocusInstruction(focus)}

**Each note should include:**
- id: unique identifier
- type: definition or formula
- title: concept name
- description: brief summary
- content: short explanation

**Return JSON object only (no markdown):**
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
}`;

    const completion = await openai.chat.completions.create(
      {
        model,
        messages: [
          {
            role: 'system',
            content: `You are a ${subject} educator creating simple study notes. You must respond with valid JSON only.`
          },
          {
            role: 'user',
            content: fallbackPrompt
          }
        ],
        max_completion_tokens: 1500, // Reduced token limit for fallback
        response_format: { type: "json_object" }, // Ensure valid JSON response
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

  // If problem text is generic (indicating image-only), adjust the prompt
  const isImageOnly = problemText === 'Problem from uploaded image';
  const problemDescription = isImageOnly 
    ? 'Analyze the image(s) provided and identify the concepts needed to solve the problem shown.'
    : problemText;

  return `Create comprehensive educational concept notes for this ${subject} problem:

**Problem:** ${problemDescription}

**Task:** ${isImageOnly ? '1. FIRST: Extract and include the complete problem statement from the image as "extractedProblemText"\n2. THEN: ' : ''}Generate exactly 5-7 detailed, unique concept notes covering all essential theories, formulas, and concepts needed to understand and solve this problem independently.${optionsPrompt}

**CRITICAL REQUIREMENTS:**
1. ${isImageOnly ? '**Extract the complete problem text from the image**\n2. ' : ''}**Generate AT LEAST 5 NOTES** with diverse types (definitions, formulas, examples, tips, applications)
2. **Each note must be SUBSTANTIVE** with 200-400 words of detailed explanation
3. **Include MULTIPLE notes per type** - Don't limit to just one formula or one example
4. **Progressive complexity** - Start with fundamentals, build to advanced applications
5. **Problem-specific guidance** - Directly connect each concept to solving THIS specific problem
6. Wrap all mathematical expressions, formulas, and symbols in $ for inline math and $$ for block math.

**Note Type Distribution (aim for this mix):**
- 1-2 definition notes (core concepts and principles)
- 2-3 formula notes (different formulas and their applications)
- 1-2 example notes (worked examples showing concept application)
- 1 tip note (problem-solving strategies)
- 1 common-mistake note (pitfalls to avoid)

**Each note MUST include:**
- **id**: Unique identifier (e.g., "free-fall-kinematics", "velocity-time-relationship")
- **type**: One of: definition, formula, example, tip, common-mistake, or application
- **title**: Specific, descriptive concept name (e.g., "Kinematic Equations for Constant Acceleration")
- **description**: 2-3 sentences explaining WHY this concept matters for THIS problem
- **content**: 200-400 word detailed explanation including:
  * Core principle and clear definition
  * Mathematical formulation with ALL variables explained
  * Step-by-step derivation or reasoning
  * Multiple real-world applications and examples
  * Common student mistakes and how to avoid them
  * Specific tips for applying to problem-solving
  * Connection to related concepts

**For formula notes, ALWAYS include:**
- **formula**: The mathematical formula as a clear string (e.g., "$$v = v₀ + at$$")
- **variables**: Array of ALL variables with meanings [{"symbol": "v", "meaning": "Final velocity in m/s"}, ...]
- **examples**: Array of 2-3 concrete example calculations

**IMPORTANT: Return ONLY a JSON object (no markdown, no code fences, no explanation text).**

**JSON Structure:**
{${isImageOnly ? '\n  "extractedProblemText": "Complete problem statement from the image",' : ''}
  "conceptNotes": [
    {
      "id": "concept-1-id",
      "type": "definition",
      "title": "First Concept Title",
      "description": "Why this concept matters for solving this problem...",
      "content": "Comprehensive 200-400 word explanation with principles, applications, examples, mistakes to avoid, and problem-solving tips...",
      "relatedTopics": ["Related concept 1", "Related concept 2"]
    },
    {
      "id": "concept-2-id",
      "type": "formula",
      "title": "First Formula Title",
      "description": "How this formula applies to this problem...",
      "content": "Detailed explanation of the formula, its derivation, when to use it, common mistakes...",
      "formula": "$$v = v₀ + at$$",
      "variables": [
        {"symbol": "v", "meaning": "Final velocity in m/s"},
        {"symbol": "a", "meaning": "Acceleration in $m/s^2$"}
      ],
      "examples": ["Example 1: A car accelerates from rest at $2 m/s^2$ for 5 seconds. What is its final velocity?", "Example 2: a ball is thrown upwards with an initial velocity of $10$ m/s. What is its velocity after 1 second?"]
    },
    (continue with 3-5 more unique, detailed notes of various types)
  ],
  "subject": "${subject}",
  "difficulty": "${difficulty}"
}

**QUALITY CHECKLIST:**
✓ Generated 5-7 unique notes (not just 3-4)
✓ Each note is 200-400 words of substantive content
✓ Multiple formula notes with different formulas
✓ Includes worked examples showing calculations
✓ Provides specific problem-solving strategies
✓ Explains common mistakes students make
✓ All formulas have complete variable definitions
✓ Content is educational and builds understanding progressively`;
};

const parseConceptNotesResponse = (response: string, subject: string, difficulty: string): ConceptNotesResponse => {
  logger.info('Raw response from OpenAI (first 500 chars):', { 
    preview: response.substring(0, 500),
    fullLength: response.length 
  });

  const jsonContent = extractJson(response);
  if (!jsonContent) {
    logger.error('Error parsing concept notes response: No JSON content found.', { rawResponse: response.substring(0, 1000) });
    throw new Error('Failed to find JSON in AI response for concept notes.');
  }

  logger.info('Extracted JSON content (first 500 chars):', {
    preview: jsonContent.substring(0, 500),
    fullLength: jsonContent.length
  });

  try {
    // When using response_format: json_object, OpenAI should return valid JSON directly
    // Try parsing the response content directly first
    let parsed;
    try {
      parsed = JSON.parse(jsonContent);
      logger.info('Successfully parsed JSON on first attempt');
    } catch (firstError) {
      logger.warn('First JSON parse attempt failed, trying cleaning', {
        errorMessage: firstError instanceof Error ? firstError.message : String(firstError),
        firstChars: jsonContent.substring(0, 100)
      });
      
      // Clean up common JSON formatting issues without corrupting escape sequences
      let cleanedContent = jsonContent
        .trim()
        // Remove control characters (but preserve valid escape sequences)
        .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]+/g, "")
        // Remove trailing commas before closing brackets/braces
        .replace(/,\s*([}\]])/g, '$1')
        // Remove any BOM or invisible characters at the start
        .replace(/^\uFEFF/, '');

      logger.info('Cleaned content (first 200 chars):', { preview: cleanedContent.substring(0, 200) });

      try {
        parsed = JSON.parse(cleanedContent);
        logger.info('Successfully parsed JSON after cleaning');
      } catch (secondError) {
        logger.error('Second parse attempt also failed', {
          errorMessage: secondError instanceof Error ? secondError.message : String(secondError),
          cleanedPreview: cleanedContent.substring(0, 200)
        });
        
        // Last resort: try to fix common escape issues
        cleanedContent = cleanedContent
          .replace(/\\([^"\\\/bfnrtu])/g, '\\\\$1');
        
        parsed = JSON.parse(cleanedContent);
        logger.info('Successfully parsed JSON after aggressive cleaning');
      }
    }

    if (!parsed.conceptNotes || !Array.isArray(parsed.conceptNotes)) {
      logger.warn('Parsed concept notes is missing a "conceptNotes" array.', { parsed });
      throw new Error('AI response for concept notes is missing the "conceptNotes" array.');
    }
    
    logger.info('Successfully parsed concept notes', { count: parsed.conceptNotes.length });
    
    return {
      conceptNotes: parsed.conceptNotes,
      subject: parsed.subject || subject,
      difficulty: parsed.difficulty || difficulty,
      extractedProblemText: parsed.extractedProblemText
    };
  } catch (error) {
    logger.error('Error parsing concept notes JSON:', {
      errorMessage: error instanceof Error ? error.message : String(error),
      jsonContentPreview: jsonContent.substring(0, 500)
    });
    throw new Error(`Failed to parse concept notes JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export default {
  generateProblemVariants,
  generateSolution,
  generateHints,
  generateConceptNotes,
  detectProblemStructure,
  selectModel
};
