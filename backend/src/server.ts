import express from 'express';
import 'express-async-errors'; // Must be imported before routes
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import config from './config/environment';
import logger, { createRequestLogger } from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import {
  corsMiddleware,
  helmetMiddleware,
  apiRateLimiter,
  timeoutMiddleware
} from './middleware/security';
import { setupSwagger } from './config/swagger';
import healthRoutes from './routes/healthRoutes';
import authRoutes from './routes/authRoutes';

// Create Express application
const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Request logging middleware
app.use(createRequestLogger());

// Security middleware
app.use(helmetMiddleware);
app.use(corsMiddleware);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Request timeout
app.use(timeoutMiddleware(30000));

// Morgan logging for development
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api', apiRateLimiter);

// Health routes (no rate limiting)
app.use('/', healthRoutes);

// Auth routes (no rate limiting)
app.use('/auth', authRoutes);

// API documentation
try {
  setupSwagger(app);
} catch (error) {
  logger.error('Failed to setup Swagger documentation:', error);
}

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  logger.info(`Server started successfully`, {
    port: config.port,
    environment: config.nodeEnv,
    apiBaseUrl: config.apiBaseUrl,
    frontendUrl: config.frontendUrl,
  });

  logger.info(`API Documentation available at: ${config.apiBaseUrl}/api-docs`);
  logger.info(`Health check available at: ${config.apiBaseUrl}/health`);
  logger.info(`Version info available at: ${config.apiBaseUrl}/version`);
}).on('error', (error) => {
  logger.error('Server startup error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', { reason, promise });
  process.exit(1);
});

// Uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  process.exit(1);
});

export default app;
