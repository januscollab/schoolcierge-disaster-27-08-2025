export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: any): AppError {
    return new AppError(message, 400, 'BAD_REQUEST', details);
  }

  static unauthorized(message: string = 'Unauthorized', details?: any): AppError {
    return new AppError(message, 401, 'UNAUTHORIZED', details);
  }

  static forbidden(message: string = 'Forbidden', details?: any): AppError {
    return new AppError(message, 403, 'FORBIDDEN', details);
  }

  static notFound(message: string = 'Resource not found', details?: any): AppError {
    return new AppError(message, 404, 'NOT_FOUND', details);
  }

  static conflict(message: string, details?: any): AppError {
    return new AppError(message, 409, 'CONFLICT', details);
  }

  static tooManyRequests(message: string = 'Too many requests', details?: any): AppError {
    return new AppError(message, 429, 'TOO_MANY_REQUESTS', details);
  }

  static internal(message: string = 'Internal server error', details?: any): AppError {
    return new AppError(message, 500, 'INTERNAL_ERROR', details);
  }
}