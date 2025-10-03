import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { storageService } from '../services/storageService';
import * as openaiService from '../services/openaiService';
import logger from '../config/logger';

const prisma = new PrismaClient();

/**
 * GET /api/problems
 * Get all problems for the authenticated user
 */
export const getAllProblems = async (req: Request, res: Response): Promise<void> => {
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
      limit = 10,
      subject,
      difficulty,
      status,
      search
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = { userId };

    if (subject) {
      where.subject = subject;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [problems, total] = await Promise.all([
      prisma.problem.findMany({
        where,
        include: {
          assets: true,
          _count: {
            select: {
              solutions: true,
              hints: true,
              conceptNotes: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.problem.count({ where })
    ]);

    logger.info(`Fetched ${problems.length} problems for user ${userId}`);

    res.json({
      success: true,
      data: problems,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error('Error fetching problems:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch problems'
    });
  }
};

/**
 * GET /api/problems/:id
 * Get a specific problem by ID
 */
export const getProblemById = async (req: Request, res: Response): Promise<void> => {
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

    const problem = await prisma.problem.findFirst({
      where: { id, userId },
      include: {
        assets: true,
        solutions: {
          orderBy: { createdAt: 'desc' }
        },
        hints: {
          orderBy: { createdAt: 'desc' }
        },
        conceptNotes: {
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            solutions: true,
            hints: true,
            conceptNotes: true
          }
        }
      }
    });

    if (!problem) {
      res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
      return;
    }

    logger.info(`Fetched problem ${id} for user ${userId}`);

    res.json({
      success: true,
      data: problem
    });
  } catch (error) {
    logger.error('Error fetching problem:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch problem'
    });
  }
};

/**
 * POST /api/problems
 * Create a new problem
 */
export const createProblem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const { title, description, subject, difficulty, imageUrl } = req.body;

    // Validate required fields
    if (!title || !description || !subject) {
      res.status(400).json({
        success: false,
        error: 'Title, description, and subject are required'
      });
      return;
    }

    // Validate subject
    const validSubjects = [
      'ap_physics_1_2', 'ap_physics_c_mechanics', 'ap_physics_c_electricity_magnetism',
      'ap_chemistry', 'ap_biology', 'ap_computer_science_a', 'ap_computer_science_principles',
      'ap_precalculus', 'ap_calculus_bc', 'ap_calculus_ab', 'ap_statistics'
    ];

    if (!validSubjects.includes(subject)) {
      res.status(400).json({
        success: false,
        error: 'Invalid subject'
      });
      return;
    }

    // Validate difficulty
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(difficulty)) {
      res.status(400).json({
        success: false,
        error: 'Invalid difficulty. Must be easy, medium, or hard'
      });
      return;
    }

    const problem = await prisma.problem.create({
      data: {
        title,
        description,
        subject,
        difficulty,
        imageUrl: imageUrl || null,
        userId,
        status: 'RECEIVED'
      },
      include: {
        assets: true
      }
    });

    logger.info(`Created problem ${problem.id} for user ${userId}`);

    res.status(201).json({
      success: true,
      data: problem,
      message: 'Problem created successfully'
    });
  } catch (error) {
    logger.error('Error creating problem:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create problem'
    });
  }
};

/**
 * PUT /api/problems/:id
 * Update a problem
 */
export const updateProblem = async (req: Request, res: Response): Promise<void> => {
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

    const { title, description, subject, difficulty, imageUrl, status } = req.body;

    // Check if problem exists and belongs to user
    const existingProblem = await prisma.problem.findFirst({
      where: { id, userId }
    });

    if (!existingProblem) {
      res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
      return;
    }

    // Validate subject if provided
    if (subject) {
      const validSubjects = [
        'ap_physics_1_2', 'ap_physics_c_mechanics', 'ap_physics_c_electricity_magnetism',
        'ap_chemistry', 'ap_biology', 'ap_computer_science_a', 'ap_computer_science_principles',
        'ap_precalculus', 'ap_calculus_bc', 'ap_calculus_ab', 'ap_statistics'
      ];

      if (!validSubjects.includes(subject)) {
        res.status(400).json({
          success: false,
          error: 'Invalid subject'
        });
        return;
      }
    }

    // Validate difficulty if provided
    if (difficulty) {
      const validDifficulties = ['easy', 'medium', 'hard'];
      if (!validDifficulties.includes(difficulty)) {
        res.status(400).json({
          success: false,
          error: 'Invalid difficulty. Must be easy, medium, or hard'
        });
        return;
      }
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['RECEIVED', 'QUEUED', 'SOLVED'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Invalid status. Must be RECEIVED, QUEUED, or SOLVED'
        });
        return;
      }
    }

    const updatedProblem = await prisma.problem.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(subject && { subject }),
        ...(difficulty && { difficulty }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(status && { status })
      },
      include: {
        assets: true
      }
    });

    logger.info(`Updated problem ${id} for user ${userId}`);

    res.json({
      success: true,
      data: updatedProblem,
      message: 'Problem updated successfully'
    });
  } catch (error) {
    logger.error('Error updating problem:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update problem'
    });
  }
};

/**
 * DELETE /api/problems/:id
 * Delete a problem
 */
export const deleteProblem = async (req: Request, res: Response): Promise<void> => {
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

    // Check if problem exists and belongs to user
    const existingProblem = await prisma.problem.findFirst({
      where: { id, userId }
    });

    if (!existingProblem) {
      res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
      return;
    }

    // Delete associated assets first
    await prisma.problemAsset.deleteMany({
      where: { problemId: id }
    });

    // Delete the problem (this will cascade delete related records due to schema setup)
    await prisma.problem.delete({
      where: { id }
    });

    logger.info(`Deleted problem ${id} for user ${userId}`);

    res.json({
      success: true,
      message: 'Problem deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting problem:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete problem'
    });
  }
};

/**
 * POST /api/problems/:id/assets
 * Associate uploaded assets with a problem
 */
export const associateAssetsWithProblem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { assetIds } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    if (!Array.isArray(assetIds) || assetIds.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Asset IDs array is required'
      });
      return;
    }

    // Check if problem exists and belongs to user
    const existingProblem = await prisma.problem.findFirst({
      where: { id, userId }
    });

    if (!existingProblem) {
      res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
      return;
    }

    // Update assets to be associated with the problem
    const updatedAssets = await Promise.all(
      assetIds.map(assetId =>
        prisma.problemAsset.update({
          where: { id: assetId },
          data: { problemId: id }
        })
      )
    );

    logger.info(`Associated ${assetIds.length} assets with problem ${id}`);

    res.json({
      success: true,
      data: updatedAssets,
      message: 'Assets associated with problem successfully'
    });
  } catch (error) {
    logger.error('Error associating assets with problem:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to associate assets with problem'
    });
  }
};

/**
 * POST /api/problems/:id/solutions
 * Generate AI solution for a problem
 */
export const generateSolution = async (req: Request, res: Response): Promise<void> => {
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

    // Fetch the problem
    const problem = await prisma.problem.findFirst({
      where: { id, userId },
      include: {
        assets: true
      }
    });

    if (!problem) {
      res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
      return;
    }

    logger.info(`Generating solution for problem ${id}`, { subject: problem.subject });

    // Create AI job record
    const aiJob = await prisma.aiJob.create({
      data: {
        type: 'SOLUTION',
        status: 'PENDING',
        input: {
          problemId: id,
          problemText: problem.description,
          subject: problem.subject,
          difficulty: problem.difficulty
        }
      }
    });

    // Update problem status
    await prisma.problem.update({
      where: { id },
      data: { status: 'QUEUED' }
    });

    try {
      // Generate solution using OpenAI
      const solutionData = await openaiService.generateSolution({
        problemText: problem.description,
        subject: problem.subject,
        difficulty: problem.difficulty || 'medium'
      });

      // Save solution to database
      const solution = await prisma.solution.create({
        data: {
          problemId: id,
          content: solutionData.methodology,
          steps: solutionData.steps as any,
          finalAnswer: solutionData.finalAnswer,
          confidence: solutionData.confidence,
          sources: solutionData.assumptions || []
        }
      });

      // Update AI job as completed
      await prisma.aiJob.update({
        where: { id: aiJob.id },
        data: {
          status: 'COMPLETED',
          output: solutionData as any
        }
      });

      // Update problem status to solved
      await prisma.problem.update({
        where: { id },
        data: { status: 'SOLVED' }
      });

      logger.info(`Solution generated successfully for problem ${id}`, { 
        jobId: aiJob.id,
        stepCount: solutionData.steps.length 
      });

      res.json({
        success: true,
        data: {
          solution: solutionData,
          solutionId: solution.id,
          jobId: aiJob.id
        }
      });
    } catch (aiError) {
      // Update AI job as failed
      await prisma.aiJob.update({
        where: { id: aiJob.id },
        data: {
          status: 'FAILED',
          error: aiError instanceof Error ? aiError.message : 'Unknown error'
        }
      });

      // Update problem status back to received
      await prisma.problem.update({
        where: { id },
        data: { status: 'RECEIVED' }
      });

      // Send error response if not already sent
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: aiError instanceof Error ? aiError.message : 'Failed to generate solution'
        });
      }
    }
  } catch (error) {
    logger.error('Error generating solution:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate solution'
      });
    }
  }
};

/**
 * POST /api/problems/:id/hints
 * Generate AI hints for a problem
 */
export const generateHints = async (req: Request, res: Response): Promise<void> => {
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

    // Fetch the problem
    const problem = await prisma.problem.findFirst({
      where: { id, userId }
    });

    if (!problem) {
      res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
      return;
    }

    const { options } = req.body;

    logger.info(`Generating hints for problem ${id}`, { subject: problem.subject, options });

    // Create AI job record
    const aiJob = await prisma.aiJob.create({
      data: {
        type: 'HINT',
        status: 'PENDING',
        input: {
          problemId: id,
          problemText: problem.description,
          subject: problem.subject
        }
      }
    });

    try {
      // Generate hints using OpenAI
      const hintsData = await openaiService.generateHints({
        problemText: problem.description,
        subject: problem.subject,
        difficulty: problem.difficulty || 'medium',
        options
      });

      // Validate hints structure before saving
      if (!hintsData || !Array.isArray(hintsData.hints)) {
        logger.error('Invalid hints structure received from AI service', { hintsData });
        throw new Error('Failed to generate valid hints from AI service.');
      }

      // Save hints to database
      const hints = await Promise.all(
        hintsData.hints.map((hint) =>
          prisma.hint.create({
            data: {
              problemId: id,
              content: `${hint.text}\n\nExplanation: ${hint.explanation}`
            }
          })
        )
      );

      // Update AI job as completed
      await prisma.aiJob.update({
        where: { id: aiJob.id },
        data: {
          status: 'COMPLETED',
          output: hintsData as any
        }
      });

      logger.info(`Hints generated successfully for problem ${id}`, { 
        jobId: aiJob.id,
        hintCount: hints.length 
      });

      res.json({
        success: true,
        data: {
          hints: hintsData.hints,
          hintIds: hints.map(h => h.id),
          progressionStrategy: hintsData.progressionStrategy,
          jobId: aiJob.id
        }
      });
    } catch (aiError) {
      // Update AI job as failed
      if (aiJob?.id) {
        await prisma.aiJob.update({
          where: { id: aiJob.id },
          data: {
            status: 'FAILED',
            error: aiError instanceof Error ? aiError.message : 'Unknown error'
          }
        });
      }

      // Send error response if not already sent
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: aiError instanceof Error ? aiError.message : 'Failed to generate hints'
        });
      }
    }
  } catch (error) {
    logger.error('Error generating hints:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate hints'
      });
    }
  }
};

/**
 * POST /api/problems/:id/concept-notes
 * Generate AI concept notes for a problem
 */
export const generateConceptNotes = async (req: Request, res: Response): Promise<void> => {
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

    // Fetch the problem
    const problem = await prisma.problem.findFirst({
      where: { id, userId }
    });

    if (!problem) {
      res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
      return;
    }

    const { options } = req.body;

    logger.info(`Generating concept notes for problem ${id}`, { subject: problem.subject, options });

    // Create AI job record
    const aiJob = await prisma.aiJob.create({
      data: {
        type: 'CONCEPT_NOTE',
        status: 'PENDING',
        input: {
          problemId: id,
          problemText: problem.description,
          subject: problem.subject
        }
      }
    });

    try {
      // Generate concept notes using OpenAI
      const conceptNotesData = await openaiService.generateConceptNotes({
        problemText: problem.description,
        subject: problem.subject,
        difficulty: problem.difficulty || 'medium',
        options
      });

      // Validate and save concept notes to the database
      if (!conceptNotesData || !Array.isArray(conceptNotesData.conceptNotes) || conceptNotesData.conceptNotes.length === 0) {
        logger.error('Invalid or empty concept notes structure received from AI service', { conceptNotesData });
        throw new Error('Failed to generate valid concept notes from AI service.');
      }

      const conceptNotes = await Promise.all(
        conceptNotesData.conceptNotes.map(note =>
          prisma.conceptNote.create({
            data: {
              problemId: id,
              title: note.title,
              content: `${note.description}\n\n${note.content}${note.formula ? `\n\nFormula: ${note.formula}` : ''}`
            }
          })
        )
      );

      // Update AI job as completed
      await prisma.aiJob.update({
        where: { id: aiJob.id },
        data: {
          status: 'COMPLETED',
          output: conceptNotesData as any
        }
      });

      logger.info(`Concept notes generated successfully for problem ${id}`, { 
        jobId: aiJob.id,
        noteCount: conceptNotes.length 
      });

      res.json({
        success: true,
        data: {
          conceptNotes: conceptNotesData.conceptNotes,
          conceptNoteIds: conceptNotes.map(n => n.id),
          subject: conceptNotesData.subject,
          difficulty: conceptNotesData.difficulty,
          jobId: aiJob.id
        }
      });
    } catch (aiError) {
      // Update AI job as failed
      if (aiJob?.id) {
        await prisma.aiJob.update({
          where: { id: aiJob.id },
          data: {
            status: 'FAILED',
            error: aiError instanceof Error ? aiError.message : 'Unknown error'
          }
        });
      }

// Send error response if not already sent
if (!res.headersSent) {
  const errorMessage = aiError instanceof Error ? aiError.message : 'An unknown error occurred while generating concept notes.';
  logger.error(`AI concept note generation failed for problem ${id}: ${errorMessage}`, { jobId: aiJob?.id });
  res.status(500).json({
    success: false,
    error: `Failed to generate concept notes: ${errorMessage}`
  });
}
    }
  } catch (error) {
    logger.error('Error generating concept notes:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate concept notes'
      });
    }
  }
};
