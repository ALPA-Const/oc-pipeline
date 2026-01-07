import morgan from 'morgan';
import { Request, Response } from 'express';

// Extended request type with custom properties
interface ExtendedRequest extends Request {
  id?: string;
  _startAt?: [number, number];
}

/**
 * Custom token for Morgan to get request ID
 */
morgan.token('request-id', (req: ExtendedRequest) => req.id || 'unknown');

/**
 * Custom token for Morgan to get response time in milliseconds
 */
morgan.token('response-time-ms', (req: ExtendedRequest, res: Response) => {
  if (!req._startAt) return '';
  const diff = process.hrtime(req._startAt);
  const ms = (diff[0] * 1000 + diff[1] / 1000000).toFixed(3);
  return `${ms}ms`;
});

/**
 * Request logger middleware using Morgan
 */
export const requestLogger = morgan((tokens, req: ExtendedRequest, res: Response) => {
  return [
    `[${new Date().toISOString()}]`,
    tokens['request-id'](req, res),
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens['response-time-ms'](req, res)
  ].join(' ');
});
