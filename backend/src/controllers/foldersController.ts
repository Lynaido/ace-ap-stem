import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { z } from 'zod';
import logger from '../config/logger';



// Validation schemas
const createFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(100, 'Folder name too long'),
  description: z.string().max(500, 'Description too long').optional(),
});

const updateFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(100, 'Folder name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
});

/**
 * GET /api/folders
 * Get all folders for the authenticated user
 */
export const getAllFolders = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const folders = await prisma.folder.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            notes: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: folders
    });
  } catch (error) {
    logger.error('Error fetching folders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch folders'
    });
  }
};

/**
 * GET /api/folders/:id
 * Get a specific folder by ID
 */
export const getFolderById = async (req: Request, res: Response): Promise<void> => {
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

    const folder = await prisma.folder.findFirst({
      where: { id, userId },
      include: {
        notes: {
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            notes: true
          }
        }
      }
    });

    if (!folder) {
      res.status(404).json({
        success: false,
        error: 'Folder not found'
      });
      return;
    }

    res.json({
      success: true,
      data: folder
    });
  } catch (error) {
    logger.error('Error fetching folder:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch folder'
    });
  }
};

/**
 * POST /api/folders
 * Create a new folder
 */
export const createFolder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const { name, description } = createFolderSchema.parse(req.body);

    const folder = await prisma.folder.create({
      data: {
        name,
        description: description || null,
        userId
      },
      include: {
        _count: {
          select: {
            notes: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: folder,
      message: 'Folder created successfully'
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

    logger.error('Error creating folder:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create folder'
    });
  }
};

/**
 * PUT /api/folders/:id
 * Update a folder
 */
export const updateFolder = async (req: Request, res: Response): Promise<void> => {
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

    // Check if folder exists and belongs to user
    const existingFolder = await prisma.folder.findFirst({
      where: { id, userId }
    });

    if (!existingFolder) {
      res.status(404).json({
        success: false,
        error: 'Folder not found'
      });
      return;
    }

    const updateData = updateFolderSchema.parse(req.body);

    const folder = await prisma.folder.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            notes: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: folder,
      message: 'Folder updated successfully'
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

    logger.error('Error updating folder:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update folder'
    });
  }
};

/**
 * DELETE /api/folders/:id
 * Delete a folder
 */
export const deleteFolder = async (req: Request, res: Response): Promise<void> => {
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

    // Check if folder exists and belongs to user
    const existingFolder = await prisma.folder.findFirst({
      where: { id, userId }
    });

    if (!existingFolder) {
      res.status(404).json({
        success: false,
        error: 'Folder not found'
      });
      return;
    }

    // Use a transaction to unassign items and then delete the folder
    await prisma.$transaction(async (tx) => {
      // Find all saved items in the folder and unassign them
      await tx.savedItem.updateMany({
        where: { folderId: id },
        data: { folderId: null },
      });

      // Delete the folder
      await tx.folder.delete({
        where: { id },
      });
    });

    res.json({
      success: true,
      message: 'Folder deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting folder:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete folder'
    });
  }
};

