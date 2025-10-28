import { Request, Response } from 'express';
import { SavedItemType } from '@prisma/client';
import prisma from '../lib/prisma';
import { z } from 'zod';
import logger from '../config/logger';



// Validation schemas
const createSavedItemSchema = z.object({
  type: z.enum(['PROBLEM', 'SOLUTION', 'HINT', 'CONCEPT_NOTE']),
  problemId: z.string().optional(),
  solutionId: z.string().optional(),
  hintId: z.string().optional(),
  conceptNoteId: z.string().optional(),
  folderId: z.string().optional(),
  starred: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

const updateSavedItemSchema = z.object({
  starred: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  folderId: z.string().nullable().optional(),
});

/**
 * GET /api/saved-items
 * Get all saved items for the authenticated user
 */
export const getAllSavedItems = async (req: Request, res: Response): Promise<void> => {
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
      type,
      starred,
      tags = []
    } = req.query;

    const where: any = { userId };

    if (type) {
      where.type = type;
    }

    if (starred === 'true') {
      where.starred = true;
    }

    if (tags && Array.isArray(tags) && tags.length > 0) {
      where.tags = {
        hasSome: tags as string[]
      };
    }

    const [savedItems, total] = await Promise.all([
      prisma.savedItem.findMany({
        where,
        include: {
          folder: true,
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
          },
          solution: true,
          hint: true,
          conceptNote: true,
          tagLinks: {
            include: {
              tag: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      }),
      prisma.savedItem.count({ where })
    ]);

    res.json({
      success: true,
      data: savedItems,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching saved items:', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch saved items'
    });
  }
};

/**
 * GET /api/saved-items/:id
 * Get a specific saved item by ID
 */
export const getSavedItemById = async (req: Request, res: Response): Promise<void> => {
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

    const savedItem = await prisma.savedItem.findFirst({
      where: { id, userId },
      include: {
        folder: true,
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
        },
        solution: true,
        hint: true,
        conceptNote: true,
        tagLinks: {
          include: {
            tag: true
          }
        }
      }
    });

    if (!savedItem) {
      res.status(404).json({
        success: false,
        error: 'Saved item not found'
      });
      return;
    }

    res.json({
      success: true,
      data: savedItem
    });
  } catch (error) {
    logger.error('Error fetching saved item:', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch saved item'
    });
  }
};

/**
 * POST /api/saved-items
 * Create a new saved item
 */
export const createSavedItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const { type, problemId, solutionId, hintId, conceptNoteId, folderId, starred, tags } = createSavedItemSchema.parse(req.body);

    // Validate that the referenced item exists and belongs to user
    let referencedItem = null;

    switch (type) {
      case 'PROBLEM':
        if (!problemId) {
          res.status(400).json({
            success: false,
            error: 'problemId is required when type is PROBLEM'
          });
          return;
        }
        referencedItem = await prisma.problem.findFirst({
          where: { id: problemId, userId }
        });
        break;
      case 'SOLUTION':
        if (!solutionId) {
          res.status(400).json({
            success: false,
            error: 'solutionId is required when type is SOLUTION'
          });
          return;
        }
        referencedItem = await prisma.solution.findFirst({
          where: { id: solutionId }
        });
        // Also check if the problem belongs to user
        if (referencedItem) {
          const problem = await prisma.problem.findFirst({
            where: { id: referencedItem.problemId, userId }
          });
          if (!problem) {
            res.status(403).json({
              success: false,
              error: 'Cannot save solution from another user\'s problem'
            });
            return;
          }
        }
        break;
      case 'HINT':
        if (!hintId) {
          res.status(400).json({
            success: false,
            error: 'hintId is required when type is HINT'
          });
          return;
        }
        referencedItem = await prisma.hint.findFirst({
          where: { id: hintId }
        });
        if (referencedItem) {
          const problem = await prisma.problem.findFirst({
            where: { id: referencedItem.problemId, userId }
          });
          if (!problem) {
            res.status(403).json({
              success: false,
              error: 'Cannot save hint from another user\'s problem'
            });
            return;
          }
        }
        break;
      case 'CONCEPT_NOTE':
        if (!conceptNoteId) {
          res.status(400).json({
            success: false,
            error: 'conceptNoteId is required when type is CONCEPT_NOTE'
          });
          return;
        }
        referencedItem = await prisma.conceptNote.findFirst({
          where: { id: conceptNoteId }
        });
        if (referencedItem) {
          const problem = await prisma.problem.findFirst({
            where: { id: referencedItem.problemId, userId }
          });
          if (!problem) {
            res.status(403).json({
              success: false,
              error: 'Cannot save concept note from another user\'s problem'
            });
            return;
          }
        }
        break;
    }

    if (!referencedItem) {
      res.status(404).json({
        success: false,
        error: `${type.toLowerCase()} not found`
      });
      return;
    }

    const savedItem = await prisma.savedItem.create({
      data: {
        type,
        problemId: problemId || null,
        solutionId: solutionId || null,
        hintId: hintId || null,
        conceptNoteId: conceptNoteId || null,
        userId,
        starred: starred || false,
        tags: tags || [],
        folderId: folderId || null
      },
      include: {
        folder: true,
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
        },
        solution: true,
        hint: true,
        conceptNote: true,
        tagLinks: {
          include: {
            tag: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: savedItem,
      message: 'Item saved successfully'
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

    logger.error('Error creating saved item:', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to save item'
    });
  }
};

/**
 * PUT /api/saved-items/:id
 * Update a saved item
 */
export const updateSavedItem = async (req: Request, res: Response): Promise<void> => {
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

    // Check if saved item exists and belongs to user
    const existingSavedItem = await prisma.savedItem.findFirst({
      where: { id, userId }
    });

    if (!existingSavedItem) {
      res.status(404).json({
        success: false,
        error: 'Saved item not found'
      });
      return;
    }

    const { starred, tags, folderId } = updateSavedItemSchema.parse(req.body);

    const updateData: any = {};
    if (starred !== undefined) updateData.starred = starred;
    if (tags !== undefined) updateData.tags = tags;
    if (folderId !== undefined) updateData.folderId = folderId;

    const savedItem = await prisma.savedItem.update({
      where: { id },
      data: updateData,
      include: {
        folder: true,
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
        },
        solution: true,
        hint: true,
        conceptNote: true,
        tagLinks: {
          include: {
            tag: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: savedItem,
      message: 'Saved item updated successfully'
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

    logger.error('Error updating saved item:', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to update saved item'
    });
  }
};

/**
 * DELETE /api/saved-items/:id
 * Delete a saved item
 */
export const deleteSavedItem = async (req: Request, res: Response): Promise<void> => {
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

    // Check if saved item exists and belongs to user
    const existingSavedItem = await prisma.savedItem.findFirst({
      where: { id, userId }
    });

    if (!existingSavedItem) {
      res.status(404).json({
        success: false,
        error: 'Saved item not found'
      });
      return;
    }

    await prisma.savedItem.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Saved item deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting saved item:', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to delete saved item'
    });
  }
};
