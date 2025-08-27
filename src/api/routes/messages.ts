import { Router } from 'express';

export const messagesRouter = Router();

// TODO: Implement message routes
messagesRouter.get('/', (req, res) => {
  res.json({ 
    message: 'Messages endpoint - Coming soon',
    data: [] 
  });
});