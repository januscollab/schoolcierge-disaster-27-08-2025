import pino from 'pino';
import { config } from '../config';

export const logger = pino({
  level: config.logging.level,
  transport: config.app.isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'SYS:standard',
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.token',
      '*.secret',
      '*.apiKey',
    ],
    censor: '[REDACTED]',
  },
});