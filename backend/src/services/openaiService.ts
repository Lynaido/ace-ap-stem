import OpenAI from 'openai';
import config from '../config/environment';
import logger from '../config/logger';

// Initialize OpenAI client
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

export const generateProblemVariants = async (params: GenerateVariantsParams): Promise<ProblemVariant[]> => {
  const { originalProblem, studyMode, variantCount = 3 } = params;
  
  try {
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
    
    logger.info('Successfully generated problem variants', { 
      generatedCount: variants.length,
      studyMode 
    });

    return variants;
  } catch (error) {
    logger.error('Error generating problem variants:', error);
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

export default {
  generateProblemVariants
};
