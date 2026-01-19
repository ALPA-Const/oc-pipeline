import { Request, Response, NextFunction } from "express";

// ============================================================================
// AppError class – structured application errors
// ============================================================================

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;
  public details?: any;

  constructor(
    message: string,
    statusCode = 500,
    code?: string,
    details?: any,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    // Fix prototype chain for Error subclassing
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// ============================================================================
// Async handler wrapper – wraps route handlers and forwards errors to next()
// ============================================================================

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// ============================================================================
// Standardized error factory helpers – used as Errors.X in routes
// ============================================================================

export const Errors = {
  VALIDATION_ERROR(message = "Validation error", details?: any) {
    return new AppError(message, 400, "VALIDATION_ERROR", details);
  },

  UNAUTHORIZED(message = "Unauthorized") {
    return new AppError(message, 401, "UNAUTHORIZED");
  },

  FORBIDDEN(message = "Forbidden") {
    return new AppError(message, 403, "FORBIDDEN");
  },

  NOT_FOUND(message = "Not found") {
    return new AppError(message, 404, "NOT_FOUND");
  },

  CONFLICT(message = "Conflict") {
    return new AppError(message, 409, "CONFLICT");
  },

  INTERNAL(message = "Internal server error", details?: any) {
    return new AppError(message, 500, "INTERNAL_ERROR", details);
  },
};

// ============================================================================
// Global error-handling middleware – keeps your original behavior but richer
// ============================================================================

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Normalize to AppError if possible
  let normalizedError: AppError;

  if (err instanceof AppError) {
    normalizedError = err;
  } else {
    const message = err?.message || "Internal Server Error";
    const statusCode = err?.statusCode || 500;
    normalizedError = new AppError(
      message,
      statusCode,
      err?.code,
      err?.details,
      err?.isOperational ?? false
    );
  }

  const statusCode = normalizedError.statusCode || 500;
  const message = normalizedError.message || "Internal Server Error";

  console.error("Error:", {
    statusCode,
    message,
    code: normalizedError.code,
    details: normalizedError.details,
    stack: normalizedError.stack,
  });

  res.status(statusCode).json({
    error: message,
    code: normalizedError.code,
    details: normalizedError.details ?? undefined,
    ...(process.env.NODE_ENV === "development" && {
      stack: normalizedError.stack,
    }),
  });
};

// ============================================================================
// 404 handler – unchanged from your original, just kept as a named export
// ============================================================================

export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
  });
};
