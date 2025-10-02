import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface EnvironmentConfig {
  port: number;
  nodeEnv: string;
  apiBaseUrl: string;
  databaseUrl: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtExpiresIn: string;
  jwtRefreshExpiresIn: string;
  googleClientId: string;
  googleClientSecret: string;
  googleCallbackUrl: string;
  openaiApiKey: string;
  openaiTimeoutMs: number;
  openaiConceptNotesTimeoutMs: number;
  redisUrl: string;
  frontendUrl: string;
  maxFileSize: number;
  uploadPath: string;
  logLevel: string;
}

const validateEnvironmentVariable = (key: string, value: string | undefined): string => {
  if (!value) {
    console.warn(`Environment variable ${key} is not set, using default value`);
    return '';
  }
  return value;
};

export const config: EnvironmentConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiBaseUrl: validateEnvironmentVariable('API_BASE_URL', process.env.API_BASE_URL),
  databaseUrl: validateEnvironmentVariable('DATABASE_URL', process.env.DATABASE_URL),
  jwtSecret: validateEnvironmentVariable('JWT_SECRET', process.env.JWT_SECRET),
  jwtRefreshSecret: validateEnvironmentVariable('JWT_REFRESH_SECRET', process.env.JWT_REFRESH_SECRET),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '60m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiTimeoutMs: parseInt(process.env.OPENAI_TIMEOUT_MS || '120000', 10),
  openaiConceptNotesTimeoutMs: parseInt(
    process.env.OPENAI_CONCEPT_NOTES_TIMEOUT_MS || process.env.OPENAI_TIMEOUT_MS || '120000',
    10
  ),
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  frontendUrl: validateEnvironmentVariable('FRONTEND_URL', process.env.FRONTEND_URL),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
  uploadPath: process.env.UPLOAD_PATH || 'uploads/',
  logLevel: process.env.LOG_LEVEL || 'info',
};

export default config;
