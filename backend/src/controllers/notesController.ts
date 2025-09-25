import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import logger from '../config/logger';

const prisma = new PrismaClient();

// Validation schemas
const createNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(1, 'Content is required'),
  folderId: z.string().optional(),
});

const updateNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  folderId: z.string().optional(),
});

/**
 * GET /api/notes
 * Get all notes for the authenticated user
 */
export const getAllNotes = async (req: Request, res: Response): Promise<void> => {
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
      folderId,
      search
    } = req.query;

    const where: any = { userId };

    if (folderId) {
      where.folderId = folderId as string;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { content: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        include: {
          folder: true
        },
        orderBy: { updatedAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      }),
      prisma.note.count({ where })
    ]);

    res.json({
      success: true,
      data: notes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching notes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notes'
    });
  }
};

/**
 * GET /api/notes/:id
 * Get a specific note by ID
 */
export const getNoteById = async (req: Request, res: Response): Promise<void> => {
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

    const note = await prisma.note.findFirst({
      where: { id, userId },
      include: {
        folder: true
      }
    });

    if (!note) {
      res.status(404).json({
        success: false,
        error: 'Note not found'
      });
      return;
    }

    res.json({
      success: true,
      data: note
    });
  } catch (error) {
    logger.error('Error fetching note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch note'
    });
  }
};

/**
 * POST /api/notes
 * Create a new note
 */
export const createNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const { title, content, folderId } = createNoteSchema.parse(req.body);

    // If folderId is provided, check if it exists and belongs to user
    if (folderId) {
      const folder = await prisma.folder.findFirst({
        where: { id: folderId, userId }
      });

      if (!folder) {
        res.status(404).json({
          success: false,
          error: 'Folder not found'
        });
        return;
      }
    }

    const note = await prisma.note.create({
      data: {
        title,
        content,
        folderId: folderId || null,
        userId
      },
      include: {
        folder: true
      }
    });

    res.status(201).json({
      success: true,
      data: note,
      message: 'Note created successfully'
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

    logger.error('Error creating note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create note'
    });
  }
};

/**
 * PUT /api/notes/:id
 * Update a note
 */
export const updateNote = async (req: Request, res: Response): Promise<void> => {
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

    // Check if note exists and belongs to user
    const existingNote = await prisma.note.findFirst({
      where: { id, userId }
    });

    if (!existingNote) {
      res.status(404).json({
        success: false,
        error: 'Note not found'
      });
      return;
    }

    const updateData = updateNoteSchema.parse(req.body);

    // If folderId is being updated, check if it exists and belongs to user
    if (updateData.folderId !== undefined) {
      if (updateData.folderId) {
        const folder = await prisma.folder.findFirst({
          where: { id: updateData.folderId, userId }
        });

        if (!folder) {
          res.status(404).json({
            success: false,
            error: 'Folder not found'
          });
          return;
        }
      }
    }

    const note = await prisma.note.update({
      where: { id },
      data: updateData,
      include: {
        folder: true
      }
    });

    res.json({
      success: true,
      data: note,
      message: 'Note updated successfully'
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

    logger.error('Error updating note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update note'
    });
  }
};

/**
 * DELETE /api/notes/:id
 * Delete a note
 */
export const deleteNote = async (req: Request, res: Response): Promise<void> => {
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

    // Check if note exists and belongs to user
    const existingNote = await prisma.note.findFirst({
      where: { id, userId }
    });

    if (!existingNote) {
      res.status(404).json({
        success: false,
        error: 'Note not found'
      });
      return;
    }

    await prisma.note.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete note'
    });
  }
};
