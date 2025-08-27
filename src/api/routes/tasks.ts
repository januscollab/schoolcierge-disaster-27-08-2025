import { Router } from 'express';

export const tasksRouter = Router();

// TODO: Implement task routes (for TIMER service)
tasksRouter.get('/', (req, res) => {
  res.json({ 
    message: 'Tasks endpoint - Coming soon',
    data: [] 
  });
});