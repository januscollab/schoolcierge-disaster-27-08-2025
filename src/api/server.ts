import { App } from './app';
import { logger } from './utils/logger';
import { gracefulShutdown } from './utils/graceful-shutdown';

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.fatal('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.fatal('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
async function bootstrap() {
  try {
    const app = new App();
    await app.start();

    // Setup graceful shutdown
    gracefulShutdown();
  } catch (error) {
    logger.fatal('Failed to bootstrap application:', error);
    process.exit(1);
  }
}

bootstrap();