import { Router } from 'express';
import { familiesRouter } from './families';
import { schoolsRouter } from './schools';
import { studentsRouter } from './students';
import { messagesRouter } from './messages';
import { tasksRouter } from './tasks';

export const apiRouter = Router();

// API version prefix
const v1Router = Router();

// Mount routes
v1Router.use('/families', familiesRouter);
v1Router.use('/schools', schoolsRouter);
v1Router.use('/students', studentsRouter);
v1Router.use('/messages', messagesRouter);
v1Router.use('/tasks', tasksRouter);

// Mount versioned API
apiRouter.use('/v1', v1Router);

// API root info
apiRouter.get('/', (req, res) => {
  res.json({
    message: 'SchoolCierge API',
    version: 'v1',
    endpoints: {
      families: '/api/v1/families',
      schools: '/api/v1/schools',
      students: '/api/v1/students',
      messages: '/api/v1/messages',
      tasks: '/api/v1/tasks',
    },
  });
});