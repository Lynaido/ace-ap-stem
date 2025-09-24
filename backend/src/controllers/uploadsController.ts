import { Request, Response } from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { storageService, FileUploadData } from '../services/storageService';
import logger from '../config/logger';

const prisma = new PrismaClient();

// Configure multer for memory storage (we'll handle the actual storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common image formats and PDF files
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDF files are allowed.'));
    }
  }
});

/**
 * POST /api/uploads
 * Upload a file and return asset metadata
 */
export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file provided'
      });
      return;
    }

    const fileData: FileUploadData = {
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    };

    // Get problem ID from request body if provided
    const problemId = req.body.problemId;

    logger.info(`Processing file upload: ${req.file.originalname}`);

    const asset = await prisma.problemAsset.create({
      data: {
        problemId: problemId || undefined,
        storageLocation: 'postgres',
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        fileData: req.file.buffer, // Store the actual file data
      }
    });

    const uploadResult = {
      id: asset.id,
      url: `/api/uploads/${asset.id}`,
      storageLocation: 'postgres',
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    };

    res.status(201).json({
      success: true,
      data: uploadResult,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    logger.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload file'
    });
  }
};

/**
 * GET /api/uploads/:id
 * Get file metadata by ID
 */
export const getFileMetadata = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // Use the imported storageService instance

    logger.info(`Fetching file metadata: ${id}`);

    const metadata = await storageService.getFileMetadata(id);

    res.json({
      success: true,
      data: metadata
    });
  } catch (error) {
    logger.error('Error fetching file metadata:', error);

    if (error instanceof Error && error.message === 'Asset not found') {
      res.status(404).json({
        success: false,
        error: 'File not found'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch file metadata'
    });
  }
};

/**
 * GET /api/uploads/:id/download
 * Download the actual file
 */
export const downloadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    logger.info(`Downloading file: ${id}`);

    const fileData = await storageService.getFileData(id);
    const metadata = await storageService.getFileMetadata(id);

    res.setHeader('Content-Type', metadata.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${metadata.fileName}"`);
    res.send(fileData);
  } catch (error) {
    logger.error('Error downloading file:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: 'File not found'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to download file'
    });
  }
};

/**
 * DELETE /api/uploads/:id
 * Delete a file
 */
export const deleteFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // Use the imported storageService instance

    logger.info(`Deleting file: ${id}`);

    await storageService.deleteFile(id);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete file'
    });
  }
};

// Export multer middleware for use in routes
export const uploadMiddleware = upload.single('file');
