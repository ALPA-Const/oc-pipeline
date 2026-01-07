import { Response } from 'express';

interface ErrorDetails {
  code: string;
  message: string;
  details?: any;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Send a successful response
 * @param res - Express response object
 * @param data - Response data
 * @param statusCode - HTTP status code (default: 200)
 */
export const success = <T>(res: Response, data: T, statusCode: number = 200): void => {
  res.status(statusCode).json({
    success: true,
    data
  });
};

/**
 * Send an error response
 * @param res - Express response object
 * @param code - Error code
 * @param message - Error message
 * @param statusCode - HTTP status code (default: 400)
 * @param details - Additional error details (optional)
 */
export const error = (
  res: Response, 
  code: string, 
  message: string, 
  statusCode: number = 400, 
  details?: any
): void => {
  const errorResponse: { success: false; error: ErrorDetails } = {
    success: false,
    error: {
      code,
      message
    }
  };

  if (details !== undefined) {
    errorResponse.error.details = details;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Send a paginated response
 * @param res - Express response object
 * @param data - Response data (array)
 * @param pagination - Pagination metadata
 * @param statusCode - HTTP status code (default: 200)
 */
export const paginated = <T>(
  res: Response, 
  data: T[], 
  pagination: PaginationMeta, 
  statusCode: number = 200
): void => {
  res.status(statusCode).json({
    success: true,
    data,
    pagination
  });
};

export default { success, error, paginated };
