import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  API_VERSION: z.string().default('v1'),
  
  // Database
  DATABASE_URL: z.string(),
  
  // Redis
  REDIS_URL: z.string().optional(),
  
  // Authentication
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // Clerk
  CLERK_SECRET_KEY: z.string().optional(),
  CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  
  // Security
  SESSION_SECRET: z.string().min(32),
  COOKIE_SECRET: z.string().min(32),
  CSRF_SECRET: z.string().min(32),
  
  // CORS
  CORS_ORIGINS: z.string().transform((val) => val.split(',')),
  CORS_CREDENTIALS: z.string().transform((val) => val === 'true').default('true'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  
  // Monitoring
  MONITORING_ENABLED: z.string().transform((val) => val === 'true').default('false'),
  HEALTH_CHECK_ENABLED: z.string().transform((val) => val === 'true').default('true'),
  
  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

// Parse and validate environment
const env = envSchema.parse(process.env);

// Export configuration
export const config = {
  app: {
    environment: env.NODE_ENV,
    port: env.PORT,
    version: env.API_VERSION,
    isProduction: env.NODE_ENV === 'production',
    isDevelopment: env.NODE_ENV === 'development',
    isTest: env.NODE_ENV === 'test',
  },
  
  database: {
    url: env.DATABASE_URL,
  },
  
  redis: {
    url: env.REDIS_URL,
  },
  
  auth: {
    jwt: {
      secret: env.JWT_SECRET,
      expiresIn: env.JWT_EXPIRES_IN,
      refreshSecret: env.JWT_REFRESH_SECRET,
      refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },
    clerk: {
      secretKey: env.CLERK_SECRET_KEY,
      publishableKey: env.CLERK_PUBLISHABLE_KEY,
      webhookSecret: env.CLERK_WEBHOOK_SECRET,
    },
    session: {
      secret: env.SESSION_SECRET,
    },
    cookie: {
      secret: env.COOKIE_SECRET,
    },
    csrf: {
      secret: env.CSRF_SECRET,
    },
  },
  
  cors: {
    origins: env.CORS_ORIGINS,
    credentials: env.CORS_CREDENTIALS,
  },
  
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },
  
  monitoring: {
    enabled: env.MONITORING_ENABLED,
    healthCheckEnabled: env.HEALTH_CHECK_ENABLED,
  },
  
  logging: {
    level: env.LOG_LEVEL,
  },
};

export type Config = typeof config;