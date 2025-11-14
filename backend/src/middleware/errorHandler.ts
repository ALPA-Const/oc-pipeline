import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
}

// AppError class for creating operational errors
export class AppError extends Error implements ApiError {
  statusCode: number;
  isOperational: boolean;
  code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error factory
export const Errors = {
  VALIDATION_ERROR: (message: string = 'Validation error') => 
    new AppError(message, 400, 'VALIDATION_ERROR'),
  
  UNAUTHORIZED: new AppError('Unauthorized', 401, 'UNAUTHORIZED'),
  
  FORBIDDEN: new AppError('Forbidden', 403, 'FORBIDDEN'),
  
  NOT_FOUND: (resource: string = 'Resource') => 
    new AppError(`${resource} not found`, 404, 'NOT_FOUND'),
  
  CONFLICT: (message: string = 'Resource already exists') => 
    new AppError(message, 409, 'CONFLICT'),
  
  INTERNAL_ERROR: new AppError('Internal server error', 500, 'INTERNAL_ERROR'),
};

// Async handler wrapper to catch errors in async route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Main error handler middleware
export const errorHandler = (
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error('Error:', {
    statusCode,
    message,
    code: err.code,
    stack: err.stack,
  });

  res.status(statusCode).json({
    error: message,
    code: err.code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// 404 handler
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
  });
};