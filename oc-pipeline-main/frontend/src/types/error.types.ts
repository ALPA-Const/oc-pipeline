/**
 * Error Envelope Contract
 * All 4xx/5xx responses must conform to this structure
 */

export interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    trace_id: string;
    timestamp: string; // ISO 8601, UTC
    path?: string;
    method?: string;
  };
  status: number;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}

export interface ErrorResponse extends ErrorEnvelope {
  error: ErrorEnvelope['error'] & {
    validation_errors?: ValidationError[];
  };
}

// Standard error codes
export enum ErrorCode {
  // 400 Bad Request
  INVALID_REQUEST = 'INVALID_REQUEST',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_JSON = 'INVALID_JSON',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // 401 Unauthorized
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // 403 Forbidden
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RLS_VIOLATION = 'RLS_VIOLATION',
  
  // 404 Not Found
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  
  // 409 Conflict
  CONFLICT = 'CONFLICT',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  CONCURRENT_MODIFICATION = 'CONCURRENT_MODIFICATION',
  
  // 422 Unprocessable Entity
  UNPROCESSABLE_ENTITY = 'UNPROCESSABLE_ENTITY',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  
  // 429 Too Many Requests
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // 500 Internal Server Error
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // 503 Service Unavailable
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE',
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public status: number = 500,
    public details?: Record<string, unknown>,
    public traceId?: string
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON(): ErrorEnvelope {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        trace_id: this.traceId || '',
        timestamp: new Date().toISOString(),
      },
      status: this.status,
    };
  }
}

export class ValidationAppError extends AppError {
  constructor(
    message: string,
    public validationErrors: ValidationError[],
    traceId?: string
  ) {
    super(ErrorCode.VALIDATION_FAILED, message, 400, { validation_errors: validationErrors }, traceId);
    this.name = 'ValidationAppError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', traceId?: string) {
    super(ErrorCode.UNAUTHORIZED, message, 401, undefined, traceId);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', traceId?: string) {
    super(ErrorCode.FORBIDDEN, message, 403, undefined, traceId);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, traceId?: string) {
    super(ErrorCode.NOT_FOUND, `${resource} not found`, 404, undefined, traceId);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, traceId?: string) {
    super(ErrorCode.CONFLICT, message, 409, undefined, traceId);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number, traceId?: string) {
    super(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'Rate limit exceeded',
      429,
      { retry_after: retryAfter },
      traceId
    );
    this.name = 'RateLimitError';
  }
}