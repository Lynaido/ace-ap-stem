import logger from '../config/logger';
import prisma from '../config/database';

export interface UploadResult {
  id: string;
  url: string;
  storageLocation: string;
  externalKey?: string;
  externalUrl?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface FileUploadData {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

/**
 * Storage service abstraction for handling file uploads
 * Currently stores files in Postgres, designed to be easily swappable to S3/R2
 */
export class StorageService {
  private static instance: StorageService;

  private constructor() {}

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Store a file in Postgres database
   */
  async storeFile(fileData: FileUploadData, problemId?: string): Promise<UploadResult> {
    try {
      logger.info(`Storing file: ${fileData.originalname}, size: ${fileData.size} bytes`);

      // Convert buffer to base64 for storage
      const base64Data = fileData.buffer.toString('base64');

      // Create problem asset record
      const asset = await prisma.problemAsset.create({
        data: {
          problemId: problemId || '',
          storageLocation: 'postgres',
          fileName: fileData.originalname,
          fileSize: fileData.size,
          mimeType: fileData.mimetype,
          fileData: fileData.buffer, // Store the actual file data
        }
      });

      // Generate a URL for accessing the file
      const url = `/api/uploads/${asset.id}`;

      logger.info(`File stored successfully: ${asset.id}`);

      return {
        id: asset.id,
        url,
        storageLocation: 'postgres',
        fileName: fileData.originalname,
        fileSize: fileData.size,
        mimeType: fileData.mimetype
      };
    } catch (error) {
      logger.error('Error storing file:', error);
      throw new Error('Failed to store file');
    }
  }

  /**
   * Get file metadata by ID
   */
  async getFileMetadata(assetId: string) {
    try {
      const asset = await prisma.problemAsset.findUnique({
        where: { id: assetId }
      });

      if (!asset) {
        throw new Error('Asset not found');
      }

      return asset;
    } catch (error) {
      logger.error('Error fetching file metadata:', error);
      throw error;
    }
  }

  /**
   * Get file data by ID
   */
  async getFileData(assetId: string): Promise<Buffer | null> {
    try {
      const asset = await prisma.problemAsset.findUnique({
        where: { id: assetId },
        select: { fileData: true }
      });

      if (!asset || !asset.fileData) {
        throw new Error('Asset not found or no file data');
      }

      return asset.fileData;
    } catch (error) {
      logger.error('Error fetching file data:', error);
      throw error;
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(assetId: string): Promise<void> {
    try {
      logger.info(`Deleting file: ${assetId}`);

      await prisma.problemAsset.delete({
        where: { id: assetId }
      });

      logger.info(`File deleted successfully: ${assetId}`);
    } catch (error) {
      logger.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Get all assets for a problem
   */
  async getProblemAssets(problemId: string) {
    try {
      const assets = await prisma.problemAsset.findMany({
        where: { problemId }
      });

      return assets;
    } catch (error) {
      logger.error('Error fetching problem assets:', error);
      throw error;
    }
  }
}

export const storageService = StorageService.getInstance();
export default storageService;
