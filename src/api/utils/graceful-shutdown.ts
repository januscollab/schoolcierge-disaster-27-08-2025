import { prisma } from './database';
import { logger } from './logger';

export function gracefulShutdown(): void {
  // Handle graceful shutdown
  const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
  
  signals.forEach((signal) => {
    process.on(signal, async () => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      
      try {
        // Close database connection
        await prisma.$disconnect();
        logger.info('Database connection closed');
        
        // Add other cleanup tasks here
        // - Close Redis connections
        // - Stop job queues
        // - Flush logs
        
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    });
  });
}