import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { AppError } from '../utils/errors';

// Extend Express Request type to include rateLimit
declare module 'express' {
  interface Request {
    rateLimit?: {
      limit: number;
      current: number;
      remaining: number;
      resetTime?: Date;
    };
  }
}

/**
 * Standard API rate limiter
 * Limits each IP to 100 requests per 15 minutes
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  
  // Custom handler for rate limit exceeded
  handler: (req: Request, res: Response) => {
    console.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: req.rateLimit?.resetTime
    });
  },
  
  // Store configuration (uses memory store by default)
  // In production, use Redis store for distributed systems
  keyGenerator: (req: Request): string => {
    // Use IP address as key, with fallback
    return req.ip || 'unknown';
  }
});

/**
 * Strict rate limiter for sensitive operations
 * Limits to 10 requests per 15 minutes
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Strict limit for sensitive operations
  message: 'Too many attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skipFailedRequests: false,
  
  handler: (req: Request, res: Response) => {
    console.error(`Strict rate limit exceeded for IP: ${req.ip} on path: ${req.path}`);
    res.status(429).json({
      error: 'Too many attempts',
      message: 'You have exceeded the maximum number of attempts. Please try again later.',
      retryAfter: req.rateLimit?.resetTime
    });
  }
});

/**
 * Authentication rate limiter
 * Prevents brute force attacks on auth endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 failed auth attempts
  message: 'Too many authentication attempts.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
  
  handler: (req: Request, res: Response) => {
    console.error(`Authentication rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Account locked',
      message: 'Too many failed authentication attempts. Account temporarily locked.',
      retryAfter: req.rateLimit?.resetTime
    });
  }
});

/**
 * Create operation limiter
 * Limits resource creation to prevent spam
 */
export const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Maximum 20 creates per hour
  message: 'Resource creation limit exceeded.',
  standardHeaders: true,
  legacyHeaders: false,
  
  handler: (req: Request, res: Response) => {
    console.warn(`Create limit exceeded for IP: ${req.ip} on resource: ${req.path}`);
    res.status(429).json({
      error: 'Creation limit exceeded',
      message: 'You have created too many resources. Please try again later.',
      retryAfter: req.rateLimit?.resetTime
    });
  }
});

/**
 * File upload rate limiter
 * Strict limits on file uploads
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Maximum 10 uploads per hour
  message: 'Upload limit exceeded.',
  standardHeaders: true,
  legacyHeaders: false,
  
  handler: (req: Request, res: Response) => {
    console.warn(`Upload limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Upload limit exceeded',
      message: 'You have exceeded the maximum number of uploads. Please try again later.',
      retryAfter: req.rateLimit?.resetTime
    });
  }
});

/**
 * Dynamic rate limiter based on user role
 * Premium users get higher limits
 */
export const dynamicLimiter = (premiumMultiplier: number = 2) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: (req: Request): number => {
      // Check if user is premium (would need to be set elsewhere)
      const isPremium = (req as any).user?.isPremium;
      return isPremium ? 200 * premiumMultiplier : 100;
    },
    message: 'Rate limit exceeded.',
    standardHeaders: true,
    legacyHeaders: false
  });
};

/**
 * IP-based blocking for suspicious activity
 */
export const suspiciousActivityLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 1000, // If someone makes 1000 requests in a day, flag them
  standardHeaders: false,
  legacyHeaders: false,
  
  handler: (req: Request, res: Response) => {
    // Log suspicious activity for security team review
    console.error(`SECURITY ALERT: Suspicious activity from IP: ${req.ip}`);
    console.error(`User Agent: ${req.get('user-agent')}`);
    console.error(`Path pattern: ${req.path}`);
    
    res.status(429).json({
      error: 'Suspicious activity detected',
      message: 'Your activity has been flagged for review. Please contact support if you believe this is an error.'
    });
  }
});