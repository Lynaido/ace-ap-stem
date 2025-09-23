import pino from 'pino';
import config from './environment';

// Create logger instance
const logger = pino({
  level: config.logLevel,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: config.nodeEnv === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  } : undefined,
});

// Create request logger middleware
export const createRequestLogger = () => {
  return (req: any, res: any, next: any) => {
    const start = Date.now();

    // Log incoming request
    logger.info({
      reqId: req.id,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
    }, 'Incoming request');

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk: any, encoding: any) {
      const duration = Date.now() - start;

      logger.info({
        reqId: req.id,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      }, 'Request completed');

      originalEnd.call(this, chunk, encoding);
    };

    next();
  };
};

export default logger;
