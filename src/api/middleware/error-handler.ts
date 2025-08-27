import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  logger.error({
    err,
    req: {
      id: req.id,
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
    },
  }, 'Request error');

  // Handle different error types
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
      request_id: req.id,
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
      request_id: req.id,
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        error: {
          code: 'DUPLICATE_ENTRY',
          message: 'A record with this value already exists',
          details: err.meta,
        },
        request_id: req.id,
      });
      return;
    }
    
    if (err.code === 'P2025') {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Record not found',
          details: err.meta,
        },
        request_id: req.id,
      });
      return;
    }
  }

  // Default error response
  const statusCode = (err as any).statusCode || 500;
  const message = statusCode === 500 
    ? 'Internal server error' 
    : err.message;

  res.status(statusCode).json({
    error: {
      code: 'INTERNAL_ERROR',
      message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
    request_id: req.id,
  });
}