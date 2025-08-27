# SchoolCierge Express API

## Status: ✅ Ready for Development

The Express API boilerplate with TypeScript is now set up and ready to use!

## Features Implemented

### Core Setup ✅
- **TypeScript Configuration** - Strict typing with path aliases
- **Express Server** - Production-ready Express application
- **Structured Architecture** - Clean separation of concerns
- **Environment Config** - Zod-validated environment variables
- **Error Handling** - Global error handler with custom error classes
- **Request Validation** - Zod-based request validation middleware
- **Logging** - Pino logger with request tracking
- **Security** - Helmet, CORS, rate limiting configured
- **Database** - Prisma ORM integration ready
- **Health Checks** - Comprehensive health endpoints

### Project Structure
```
src/api/
├── app.ts                 # Express application setup
├── server.ts              # Server entry point
├── config/
│   └── index.ts          # Configuration management
├── middleware/
│   ├── error-handler.ts  # Global error handling
│   ├── not-found.ts      # 404 handler
│   └── request-validator.ts # Request validation
├── routes/
│   ├── api.ts            # API router aggregator
│   ├── health.ts         # Health check endpoints
│   ├── families.ts       # Family CRUD (example)
│   └── ...              # Other route modules
├── utils/
│   ├── database.ts       # Prisma client
│   ├── errors.ts         # Custom error classes
│   ├── logger.ts         # Pino logger setup
│   └── graceful-shutdown.ts # Cleanup handler
└── types/                # TypeScript type definitions
```

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

### 3. Setup Database
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Or push schema directly (dev)
npm run db:push

# Open Prisma Studio
npm run db:studio
```

### 4. Start Development Server
```bash
npm run dev
```

Server will start on http://localhost:3000

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production server
- `npm run typecheck` - Check TypeScript types
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## API Endpoints

### Health Checks
- `GET /health` - Basic health status
- `GET /health/live` - Liveness probe (with DB check)
- `GET /health/ready` - Readiness probe

### API Routes (v1)
- `GET /api` - API information
- `GET /api/v1/families` - List families
- `GET /api/v1/families/:id` - Get family by ID
- `POST /api/v1/families` - Create family
- `PATCH /api/v1/families/:id` - Update family
- `DELETE /api/v1/families/:id` - Delete family

### Coming Soon
- `/api/v1/schools` - School management
- `/api/v1/students` - Student management
- `/api/v1/messages` - Message handling
- `/api/v1/tasks` - Task management (TIMER)

## Environment Variables

Required variables (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret (min 32 chars)
- `JWT_REFRESH_SECRET` - Refresh token secret
- `SESSION_SECRET` - Session secret
- `COOKIE_SECRET` - Cookie signing secret
- `CSRF_SECRET` - CSRF protection secret
- `CORS_ORIGINS` - Comma-separated allowed origins

## Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Request throttling
- **Request ID** - Request tracking
- **Input Validation** - Zod schemas
- **Error Sanitization** - No stack traces in production

## Next Steps

1. **Add Authentication Middleware** 
   - Integrate Clerk authentication
   - Add JWT validation
   
2. **Implement Remaining Routes**
   - Schools, Students, Messages, Tasks
   
3. **Add Queue Processing**
   - BullMQ for async jobs
   - Email/WhatsApp processing
   
4. **Add Tests**
   - Unit tests for services
   - Integration tests for routes

## Development Tips

### Adding a New Route
1. Create route file in `src/api/routes/`
2. Define validation schemas with Zod
3. Implement route handlers
4. Import and mount in `src/api/routes/api.ts`

### Custom Errors
```typescript
import { AppError } from '@utils/errors';

throw AppError.notFound('Resource not found');
throw AppError.badRequest('Invalid input');
throw AppError.unauthorized('Not authenticated');
```

### Request Validation
```typescript
import { z } from 'zod';
import { requestValidator } from '@middleware/request-validator';

const schema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

router.post('/', requestValidator(schema), handler);
```

## Task Status: TASK-005
Express API boilerplate is now complete with:
- ✅ TypeScript configuration
- ✅ Express server setup
- ✅ Middleware stack
- ✅ Error handling
- ✅ Route structure
- ✅ Database integration ready
- ✅ Security configured
- ✅ Logging implemented
- ✅ Environment management