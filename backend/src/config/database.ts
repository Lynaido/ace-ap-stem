import { PrismaClient } from '@prisma/client';
import logger from './logger';

// Singleton Prisma Client instance
// This prevents creating multiple database connection pools
// which was causing severe performance issues

let prisma: PrismaClient;

declare global {
  var __prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
} else {
  // In development, use a global variable to preserve the instance
  // across hot reloads to prevent connection pool exhaustion
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
    logger.info('Created new Prisma Client instance');
  }
  prisma = global.__prisma;
}

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  logger.info('Prisma Client disconnected');
});

export default prisma;
