import { Router, Request, Response } from 'express';
import { isDatabaseHealthy } from '../utils/database';
import { config } from '../config';

export const healthRouter = Router();

// Basic health check
healthRouter.get('/', async (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.app.environment,
    version: config.app.version,
  });
});

// Detailed health check
healthRouter.get('/live', async (req: Request, res: Response) => {
  const checks = {
    api: true,
    database: await isDatabaseHealthy(),
    timestamp: new Date().toISOString(),
  };

  const isHealthy = Object.values(checks).every(v => v !== false);
  
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    checks,
  });
});

// Readiness check
healthRouter.get('/ready', async (req: Request, res: Response) => {
  const dbHealthy = await isDatabaseHealthy();
  
  if (dbHealthy) {
    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
    });
  }
});