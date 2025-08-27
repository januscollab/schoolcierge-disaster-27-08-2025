import { Router } from 'express';

export const schoolsRouter = Router();

// TODO: Implement school routes
schoolsRouter.get('/', (req, res) => {
  res.json({ 
    message: 'Schools endpoint - Coming soon',
    data: [] 
  });
});