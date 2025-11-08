import { v4 as uuidv4 } from 'uuid';
import type { ErrorEnvelope, ErrorResponse } from '@/types/error.types';
import { AppError, ErrorCode } from '@/types/error.types';

/**
 * Error Handler with Trace ID and Structured Logging
 * All errors are logged with traceId for correlation
 */

interface LogContext {
  traceId: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  error?: unknown;
  metadata?: Record<string, unknown>;
}

class ErrorHandler {
  private static instance: ErrorHandler;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Generate a unique trace ID for request correlation
   */
  generateTraceId(): string {
    return uuidv4();
  }

  /**
   * Log error with structured format and trace ID
   */
  private log(context: LogContext): void {
    const logEntry = {
      timestamp: context.timestamp,
      level: context.level,
      trace_id: context.traceId,
      message: context.message,
      error: context.error instanceof Error ? {
        name: context.error.name,
        message: context.error.message,
        stack: context.error.stack,
      } : context.error,
      metadata: context.metadata,
    };

    // In production, send to logging service (e.g., Datadog, Sentry)
    // For now, console log with structured format
    if (context.level === 'error') {
      console.error(JSON.stringify(logEntry));
    } else if (context.level === 'warn') {
      console.warn(JSON.stringify(logEntry));
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }

  /**
   * Handle error and return standardized error envelope
   */
  handleError(
    error: unknown,
    traceId?: string,
    path?: string,
    method?: string
  ): ErrorResponse {
    const trace = traceId || this.generateTraceId();
    const timestamp = new Date().toISOString();

    // Log the error
    this.log({
      traceId: trace,
      timestamp,
      level: 'error',
      message: 'Error occurred',
      error,
      metadata: { path, method },
    });

    // Handle AppError instances
    if (error instanceof AppError) {
      return {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          trace_id: trace,
          timestamp,
          path,
          method,
        },
        status: error.status,
      };
    }

    // Handle standard Error instances
    if (error instanceof Error) {
      return {
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: error.message,
          trace_id: trace,
          timestamp,
          path,
          method,
        },
        status: 500,
      };
    }

    // Handle unknown errors
    return {
      error: {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred',
        trace_id: trace,
        timestamp,
        path,
        method,
      },
      status: 500,
    };
  }

  /**
   * Create error response for API endpoints
   */
  createErrorResponse(
    code: ErrorCode,
    message: string,
    status: number,
    traceId?: string,
    details?: Record<string, unknown>
  ): ErrorResponse {
    const trace = traceId || this.generateTraceId();
    const timestamp = new Date().toISOString();

    this.log({
      traceId: trace,
      timestamp,
      level: status >= 500 ? 'error' : 'warn',
      message: `${code}: ${message}`,
      metadata: { status, details },
    });

    return {
      error: {
        code,
        message,
        details,
        trace_id: trace,
        timestamp,
      },
      status,
    };
  }

  /**
   * Wrap async handler with error handling
   */
  wrapHandler<T>(
    handler: (traceId: string) => Promise<T>
  ): () => Promise<T | ErrorResponse> {
    return async () => {
      const traceId = this.generateTraceId();
      try {
        return await handler(traceId);
      } catch (error) {
        return this.handleError(error, traceId);
      }
    };
  }

  /**
   * Validate response includes required error fields
   */
  validateErrorResponse(response: unknown): response is ErrorResponse {
    if (typeof response !== 'object' || response === null) {
      return false;
    }

    const err = response as ErrorResponse;
    return (
      typeof err.error === 'object' &&
      typeof err.error.code === 'string' &&
      typeof err.error.message === 'string' &&
      typeof err.error.trace_id === 'string' &&
      typeof err.error.timestamp === 'string' &&
      typeof err.status === 'number'
    );
  }
}

export const errorHandler = ErrorHandler.getInstance();

/**
 * Middleware for Next.js API routes
 */
export function withErrorHandler<T>(
  handler: (traceId: string, ...args: unknown[]) => Promise<T>
) {
  return async (...args: unknown[]): Promise<T | ErrorResponse> => {
    const traceId = errorHandler.generateTraceId();
    try {
      return await handler(traceId, ...args);
    } catch (error) {
      return errorHandler.handleError(error, traceId);
    }
  };
}

/**
 * Assert condition or throw error with trace ID
 */
export function assert(
  condition: boolean,
  code: ErrorCode,
  message: string,
  status: number = 400,
  traceId?: string
): asserts condition {
  if (!condition) {
    throw new AppError(code, message, status, undefined, traceId);
  }
}