import escapeHtml from 'escape-html';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Security utility functions for SchoolCierge
 * Provides HTML escaping, input sanitization, and security helpers
 */

/**
 * Escape HTML special characters to prevent XSS attacks
 * @param str - The string to escape
 * @returns The escaped string safe for HTML output
 */
export const sanitizeHtml = (str: string | undefined | null): string => {
  if (!str) return '';
  return escapeHtml(String(str));
};

/**
 * Escape an object's string values for safe HTML output
 * @param obj - The object to sanitize
 * @returns Object with escaped string values
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeHtml(sanitized[key]) as any;
    } else if (Array.isArray(sanitized[key])) {
      sanitized[key] = sanitized[key].map((item: any) => 
        typeof item === 'string' ? sanitizeHtml(item) : 
        typeof item === 'object' ? sanitizeObject(item) : item
      ) as any;
    } else if (sanitized[key] && typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeObject(sanitized[key]) as any;
    }
  }
  
  return sanitized;
};

/**
 * Sanitize array of items for safe HTML output
 * @param items - Array of items to sanitize
 * @returns Array with sanitized items
 */
export const sanitizeArray = <T>(items: T[]): T[] => {
  return items.map(item => {
    if (typeof item === 'string') {
      return sanitizeHtml(item) as unknown as T;
    } else if (item && typeof item === 'object') {
      return sanitizeObject(item as any) as T;
    }
    return item;
  });
};

/**
 * Generate a secure random token
 * @param length - Length of the token in bytes (default: 32)
 * @returns Hex string token
 */
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash sensitive data using SHA256
 * @param data - Data to hash
 * @returns Hashed string
 */
export const hashData = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Validate UUID format
 * @param uuid - String to validate
 * @returns True if valid UUID
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Sanitize file path to prevent directory traversal
 * @param filepath - Path to sanitize
 * @returns Sanitized path
 */
export const sanitizePath = (filepath: string): string => {
  // Remove any directory traversal attempts
  return filepath.replace(/\.\./g, '').replace(/[^a-zA-Z0-9\-_\.\/]/g, '');
};

/**
 * Security headers middleware
 * Sets various security headers to protect against common attacks
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY');
  
  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer-Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content-Security-Policy (basic policy - adjust as needed)
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self'"
  );
  
  next();
};

/**
 * Remove sensitive fields from objects before sending to client
 * @param obj - Object to clean
 * @param sensitiveFields - Array of field names to remove
 * @returns Cleaned object
 */
export const removeSensitiveFields = <T extends Record<string, any>>(
  obj: T,
  sensitiveFields: string[] = ['password', 'token', 'secret', 'apiKey', 'refreshToken']
): Partial<T> => {
  const cleaned = { ...obj };
  
  sensitiveFields.forEach(field => {
    delete cleaned[field];
  });
  
  return cleaned;
};

/**
 * Rate limiting key generator for IP-based limiting
 * @param req - Express request object
 * @returns Key for rate limiting
 */
export const getRateLimitKey = (req: Request): string => {
  // Use IP address, with fallback to a default
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  return `ratelimit:${ip}`;
};