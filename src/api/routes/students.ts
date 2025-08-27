import { Router } from 'express';

export const studentsRouter = Router();

// TODO: Implement student routes
studentsRouter.get('/', (req, res) => {
  res.json({ 
    message: 'Students endpoint - Coming soon',
    data: [] 
  });
});