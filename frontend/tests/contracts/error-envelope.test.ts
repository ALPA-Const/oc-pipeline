import { describe, it, expect } from 'vitest';
import { errorHandler } from '@/lib/error-handler';
import { AppError, ErrorCode, ValidationAppError } from '@/types/error.types';

describe('Error Envelope Contract', () => {
  it('should return error envelope with all required fields', () => {
    const error = new AppError(
      ErrorCode.NOT_FOUND,
      'Resource not found',
      404
    );

    const envelope = errorHandler.handleError(error);

    expect(envelope).toHaveProperty('error');
    expect(envelope).toHaveProperty('status');
    expect(envelope.error).toHaveProperty('code');
    expect(envelope.error).toHaveProperty('message');
    expect(envelope.error).toHaveProperty('trace_id');
    expect(envelope.error).toHaveProperty('timestamp');
  });

  it('should generate unique trace IDs', () => {
    const traceId1 = errorHandler.generateTraceId();
    const traceId2 = errorHandler.generateTraceId();

    expect(traceId1).not.toBe(traceId2);
    expect(traceId1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('should include validation errors in envelope', () => {
    const validationError = new ValidationAppError(
      'Validation failed',
      [
        { field: 'email', message: 'Invalid email format', code: 'INVALID_FORMAT' },
        { field: 'phone', message: 'Phone number required', code: 'REQUIRED' },
      ]
    );

    const envelope = errorHandler.handleError(validationError);

    expect(envelope.status).toBe(400);
    expect(envelope.error.code).toBe(ErrorCode.VALIDATION_FAILED);
    expect(envelope.error.details).toHaveProperty('validation_errors');
    expect(envelope.error.details?.validation_errors).toHaveLength(2);
  });

  it('should handle unknown errors gracefully', () => {
    const unknownError = { weird: 'object' };
    const envelope = errorHandler.handleError(unknownError);

    expect(envelope.status).toBe(500);
    expect(envelope.error.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
    expect(envelope.error.trace_id).toBeDefined();
  });

  it('should validate error response structure', () => {
    const error = new AppError(ErrorCode.UNAUTHORIZED, 'Unauthorized', 401);
    const envelope = errorHandler.handleError(error);

    const isValid = errorHandler.validateErrorResponse(envelope);
    expect(isValid).toBe(true);
  });

  it('should reject invalid error responses', () => {
    const invalidResponse = { error: 'just a string' };
    const isValid = errorHandler.validateErrorResponse(invalidResponse);
    expect(isValid).toBe(false);
  });

  it('should include timestamp in ISO 8601 format', () => {
    const error = new AppError(ErrorCode.FORBIDDEN, 'Forbidden', 403);
    const envelope = errorHandler.handleError(error);

    expect(envelope.error.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('should preserve error details', () => {
    const error = new AppError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'Too many requests',
      429,
      { retry_after: 60 }
    );

    const envelope = errorHandler.handleError(error);

    expect(envelope.error.details).toEqual({ retry_after: 60 });
  });
});