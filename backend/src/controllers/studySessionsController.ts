import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import logger from '../config/logger';
import { generateProblemVariants } from '../services/openaiService';

const prisma = new PrismaClient();

// Validation schemas
const createStudySessionSchema = z.object({
  problemId: z.string().min(1, 'Problem ID is required'),
  metadata: z.object({
    difficulty: z.string().optional(),
    estimatedTime: z.number().optional(),
    notes: z.string().optional()
  }).optional(),
});

const updateStudySessionSchema = z.object({
  metadata: z.object({
    difficulty: z.string().optional(),
    estimatedTime: z.number().optional(),
    notes: z.string().optional(),
    actualTime: z.number().optional(),
    completed: z.boolean().optional()
  }).optional(),
});

const generateVariantsSchema = z.object({
  studyMode: z.string().min(1, 'Study mode is required'),
  variantCount: z.number().min(1).max(5).default(3),
});

/**
 * GET /api/study-sessions
 * Get all study sessions for the authenticated user
 */
export const getAllStudySessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const {
      page = 1,
      limit = 20,
      problemId
    } = req.query;

    const where: any = { userId };

    if (problemId) {
      where.problemId = problemId;
    }

    const [studySessions, total] = await Promise.all([
      prisma.studySession.findMany({
        where,
        include: {
          problem: {
            select: {
              id: true,
              title: true,
              subject: true,
              difficulty: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      }),
      prisma.studySession.count({ where })
    ]);

    res.json({
      success: true,
      data: studySessions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching study sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch study sessions'
    });
  }
};

/**
 * GET /api/study-sessions/:id
 * Get a specific study session by ID
 */
export const getStudySessionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const studySession = await prisma.studySession.findFirst({
      where: { id, userId },
      include: {
        problem: {
          include: {
            assets: true,
            _count: {
              select: {
                solutions: true,
                hints: true,
                conceptNotes: true
              }
            }
          }
        }
      }
    });

    if (!studySession) {
      res.status(404).json({
        success: false,
        error: 'Study session not found'
      });
      return;
    }

    res.json({
      success: true,
      data: studySession
    });
  } catch (error) {
    logger.error('Error fetching study session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch study session'
    });
  }
};

/**
 * POST /api/study-sessions
 * Create a new study session
 */
export const createStudySession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const { problemId, metadata } = createStudySessionSchema.parse(req.body);

    // Check if problem exists and belongs to user
    const problem = await prisma.problem.findFirst({
      where: { id: problemId, userId }
    });

    if (!problem) {
      res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
      return;
    }

    const studySession = await prisma.studySession.create({
      data: {
        problemId,
        userId,
        variants: [], // Empty array for now, will be populated by AI later
        metadata: metadata || {}
      },
      include: {
        problem: {
          include: {
            assets: true,
            _count: {
              select: {
                solutions: true,
                hints: true,
                conceptNotes: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: studySession,
      message: 'Study session created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
      return;
    }

    logger.error('Error creating study session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create study session'
    });
  }
};

/**
 * PUT /api/study-sessions/:id
 * Update a study session
 */
export const updateStudySession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    // Check if study session exists and belongs to user
    const existingStudySession = await prisma.studySession.findFirst({
      where: { id, userId }
    });

    if (!existingStudySession) {
      res.status(404).json({
        success: false,
        error: 'Study session not found'
      });
      return;
    }

    const updateData = updateStudySessionSchema.parse(req.body);

    const studySession = await prisma.studySession.update({
      where: { id },
      data: updateData,
      include: {
        problem: {
          include: {
            assets: true,
            _count: {
              select: {
                solutions: true,
                hints: true,
                conceptNotes: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: studySession,
      message: 'Study session updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
      return;
    }

    logger.error('Error updating study session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update study session'
    });
  }
};

/**
 * DELETE /api/study-sessions/:id
 * Delete a study session
 */
export const deleteStudySession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    // Check if study session exists and belongs to user
    const existingStudySession = await prisma.studySession.findFirst({
      where: { id, userId }
    });

    if (!existingStudySession) {
      res.status(404).json({
        success: false,
        error: 'Study session not found'
      });
      return;
    }

    await prisma.studySession.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Study session deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting study session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete study session'
    });
  }
};

/**
 * POST /api/study-sessions/:id/variants
 * Generate AI-powered problem variants for a study session
 */
export const generateVariants = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const { studyMode, variantCount } = generateVariantsSchema.parse(req.body);

    // Find the study session and verify ownership
    const studySession = await prisma.studySession.findFirst({
      where: { id, userId },
      include: {
        problem: true
      }
    });

    if (!studySession) {
      res.status(404).json({
        success: false,
        error: 'Study session not found'
      });
      return;
    }

    // Generate variants using OpenAI
    const variants = await generateProblemVariants({
      originalProblem: {
        title: studySession.problem.title,
        description: studySession.problem.description,
        subject: studySession.problem.subject,
        difficulty: studySession.problem.difficulty
      },
      studyMode,
      variantCount
    });

    if (variants.length === 0) {
      throw new Error('No variants were generated');
    }
    // Update the study session with generated variants
    const updatedSession = await prisma.studySession.update({
      where: { id },
      data: {
        variants: variants as any, // Store as JSON
        metadata: {
          ...((studySession.metadata as any) || {}),
          studyMode,
          variantsGenerated: true,
          generatedAt: new Date().toISOString()
        }
      },
      include: {
        problem: {
          include: {
            assets: true
          }
        }
      }
    });

    logger.info(`Generated ${variants.length} variants for study session ${id}`);

    res.status(200).json({
      success: true,
      data: {
        studySession: updatedSession,
        variants
      },
      message: `Generated ${variants.length} practice variants successfully`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
      return;
    }

    logger.error('Error generating variants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate variants. Please try again.'
    });
  }
};
