import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss';
import { config } from './config';
import { errorHandler } from './middleware/error-handler';
import { notFoundHandler } from './middleware/not-found';
import { requestValidator } from './middleware/request-validator';
import { healthRouter } from './routes/health';
import { apiRouter } from './routes/api';
import { logger } from './utils/logger';
import { prisma } from './utils/database';
import { securityHeaders } from './utils/security';

export class App {
  private app: Application;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", "data:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
        reportOnly: false,
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: true,
      crossOriginResourcePolicy: { policy: "cross-origin" },
      dnsPrefetchControl: true,
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      ieNoOpen: true,
      noSniff: true,
      originAgentCluster: true,
      permittedCrossDomainPolicies: false,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      xssFilter: true,
    }));
    
    // Additional security headers
    this.app.use(securityHeaders);
    
    // Prevent NoSQL injection attacks
    this.app.use(mongoSanitize({
      replaceWith: '_',
      onSanitize: ({ req, key }) => {
        logger.warn(`Potential NoSQL injection attempt blocked from ${req.ip}: ${key}`);
      },
    }));
    
    // XSS protection for request body, query, and params
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      // Clean body
      if (req.body) {
        const cleanBody = JSON.stringify(req.body);
        req.body = JSON.parse(xss(cleanBody));
      }
      // Clean query parameters
      if (req.query) {
        for (const key in req.query) {
          if (typeof req.query[key] === 'string') {
            req.query[key] = xss(req.query[key] as string) as any;
          }
        }
      }
      next();
    });

    // CORS configuration
    this.app.use(cors({
      origin: config.cors.origins,
      credentials: config.cors.credentials,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use(pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) => req.url === '/health',
      },
      customLogLevel: (req, res, err) => {
        if (res.statusCode >= 400 && res.statusCode < 500) {
          return 'warn';
        } else if (res.statusCode >= 500 || err) {
          return 'error';
        }
        return 'info';
      },
    }));

    // Rate limiting with different limits for different endpoints
    const generalLimiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1', // Skip for localhost in dev
    });
    
    const strictLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 requests per window
      message: 'Too many attempts, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });

    this.app.use('/api', generalLimiter);
    this.app.use('/api/v1/families', strictLimiter); // Extra protection for sensitive endpoints
    this.app.use('/api/auth', strictLimiter); // Extra protection for auth endpoints

    // Request ID middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      req.id = req.headers['x-request-id'] as string || 
               `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      res.setHeader('X-Request-ID', req.id);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check routes
    this.app.use('/health', healthRouter);
    
    // API routes
    this.app.use('/api', apiRouter);

    // Root route
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        name: 'SchoolCierge API',
        version: config.app.version,
        environment: config.app.environment,
        timestamp: new Date().toISOString(),
      });
    });
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);
    
    // Global error handler
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Test database connection
      await prisma.$connect();
      logger.info('Database connected successfully');

      // Start server
      const port = config.app.port;
      this.app.listen(port, () => {
        logger.info(`Server running on port ${port} in ${config.app.environment} mode`);
        logger.info(`Health check: http://localhost:${port}/health`);
        logger.info(`API base: http://localhost:${port}/api`);
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  public getApp(): Application {
    return this.app;
  }
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      id?: string;
      userId?: string;
      user?: any;
    }
  }
}