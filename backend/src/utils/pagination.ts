import { ParsedQs } from 'qs';

interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
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
 * Parse pagination parameters from query string
 * @param query - Express req.query object
 * @returns Parsed pagination parameters
 */
export const parsePagination = (query: ParsedQs): PaginationParams => {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(
    Math.max(1, parseInt(query.limit as string) || 20),
    100 // maxLimit
  );
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset
  };
};

/**
 * Build pagination metadata for response
 * @param total - Total number of items
 * @param page - Current page number
 * @param limit - Items per page
 * @returns Pagination metadata
 */
export const buildPaginationMeta = (total: number, page: number, limit: number): PaginationMeta => {
  const pages = Math.ceil(total / limit);
  const hasNext = page < pages;
  const hasPrev = page > 1;

  return {
    total,
    page,
    limit,
    pages,
    hasNext,
    hasPrev
  };
};

export default { parsePagination, buildPaginationMeta };
