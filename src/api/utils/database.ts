import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { logger } from './logger';

// Create Prisma client with logging
export const prisma = new PrismaClient({
  log: config.app.isDevelopment 
    ? ['query', 'error', 'warn'] 
    : ['error'],
  errorFormat: config.app.isDevelopment ? 'pretty' : 'minimal',
});

// Log database queries in development
if (config.app.isDevelopment) {
  // TypeScript workaround for Prisma query logging
  (prisma as any).$on('query', (e: any) => {
    logger.debug({
      query: e.query,
      params: e.params,
      duration: e.duration,
    }, 'Database query');
  });
}

// Handle connection errors
prisma.$connect()
  .then(() => {
    logger.info('Database connection established');
  })
  .catch((error) => {
    logger.error('Failed to connect to database:', error);
    process.exit(1);
  });

export async function isDatabaseHealthy(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
}