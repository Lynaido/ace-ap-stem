import { Request, Response } from 'express';
import { } from '@prisma/client';
import prisma from '../lib/prisma';
import { z } from 'zod';
import logger from '../config/logger';



// Validation schemas
const createTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(50, 'Tag name too long'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
});

/**
 * GET /api/tags
 * Get all tags for the authenticated user
 */
export const getAllTags = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            tagLinks: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: tags
    });
  } catch (error) {
    logger.error('Error fetching tags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tags'
    });
  }
};

/**
 * POST /api/tags
 * Create a new tag
 */
export const createTag = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const { name, color } = createTagSchema.parse(req.body);

    // Check if tag name already exists (unique constraint in schema)
    const existingTag = await prisma.tag.findUnique({
      where: { name }
    });

    if (existingTag) {
      res.status(409).json({
        success: false,
        error: 'Tag with this name already exists'
      });
      return;
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        color: color || null
      },
      include: {
        _count: {
          select: {
            tagLinks: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: tag,
      message: 'Tag created successfully'
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

    // Handle unique constraint violation
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: 'Tag with this name already exists'
      });
      return;
    }

    logger.error('Error creating tag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create tag'
    });
  }
};

/**
 * DELETE /api/tags/:id
 * Delete a tag
 */
export const deleteTag = async (req: Request, res: Response): Promise<void> => {
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

    // Check if tag exists
    const existingTag = await prisma.tag.findUnique({
      where: { id }
    });

    if (!existingTag) {
      res.status(404).json({
        success: false,
        error: 'Tag not found'
      });
      return;
    }

    // Delete the tag (tagLinks will be cascade deleted)
    await prisma.tag.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Tag deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting tag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete tag'
    });
  }
};
