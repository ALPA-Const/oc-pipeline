import rateLimit from 'express-rate-limit';

/**
 * Default rate limiter: 100 requests per 15 minutes
 */
export const defaultRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.'
    }
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

interface RateLimiterOptions {
  windowMs?: number;
  max?: number;
  message?: string | object | null;
}

/**
 * Configurable rate limiter factory function
 * @param windowMs - Window in milliseconds
 * @param max - Maximum number of requests
 * @param message - Custom message
 */
export const createRateLimiter = ({ 
  windowMs = 15 * 60 * 1000, 
  max = 100, 
  message = null 
}: RateLimiterOptions = {}) => {
  return rateLimit({
    windowMs,
    max,
    message: message || {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later.'
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};
