import { describe, it, expect } from 'vitest';
import { errorHandler } from '@/lib/error-handler';
import { ErrorCode } from '@/types/error.types';

describe('TraceId on All 4xx/5xx Responses', () => {
  const errorCodes = [
    { code: ErrorCode.INVALID_REQUEST, status: 400 },
    { code: ErrorCode.UNAUTHORIZED, status: 401 },
    { code: ErrorCode.FORBIDDEN, status: 403 },
    { code: ErrorCode.NOT_FOUND, status: 404 },
    { code: ErrorCode.CONFLICT, status: 409 },
    { code: ErrorCode.UNPROCESSABLE_ENTITY, status: 422 },
    { code: ErrorCode.RATE_LIMIT_EXCEEDED, status: 429 },
    { code: ErrorCode.INTERNAL_SERVER_ERROR, status: 500 },
    { code: ErrorCode.SERVICE_UNAVAILABLE, status: 503 },
  ];

  errorCodes.forEach(({ code, status }) => {
    it(`should include trace_id on ${status} ${code}`, () => {
      const response = errorHandler.createErrorResponse(
        code,
        `Test error for ${code}`,
        status
      );

      expect(response.error.trace_id).toBeDefined();
      expect(response.error.trace_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(response.status).toBe(status);
    });
  });

  it('should allow custom trace_id to be passed', () => {
    const customTraceId = 'custom-trace-123';
    const response = errorHandler.createErrorResponse(
      ErrorCode.NOT_FOUND,
      'Not found',
      404,
      customTraceId
    );

    expect(response.error.trace_id).toBe(customTraceId);
  });

  it('should log trace_id for correlation', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = errorHandler.createErrorResponse(
      ErrorCode.INTERNAL_SERVER_ERROR,
      'Server error',
      500
    );

    expect(consoleSpy).toHaveBeenCalled();
    const logEntry = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(logEntry.trace_id).toBe(response.error.trace_id);

    consoleSpy.mockRestore();
  });
});