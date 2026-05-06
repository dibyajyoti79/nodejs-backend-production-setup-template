/**
 * @fileoverview HTTP request logging middleware
 * 
 * Logs all incoming HTTP requests with relevant details including:
 * - Request method, path, and query parameters
 * - Response status code and response time
 * - Correlation ID for request tracing
 * 
 * @module middlewares/request-logging
 * 
 * @example
 * // In server.ts
 * import { requestLogger } from './middlewares/request-logging.middleware';
 * app.use(requestLogger);
 */

import { NextFunction,Request, Response } from 'express';

import logger from '../config/logger.config';
import { getCorrelationId } from '../utils/helpers/request.helpers';

// ============================================================================
// Types
// ============================================================================

/**
 * Extended Response interface to include response time tracking.
 */
interface ResponseWithTime extends Response {
  locals: {
    startTime?: number;
  } & Response['locals'];
}

// ============================================================================
// Request Logger Middleware
// ============================================================================

/**
 * Express middleware that logs all HTTP requests.
 * 
 * Logs include:
 * - HTTP method and path
 * - Query parameters (sanitized)
 * - Response status code
 * - Response time in milliseconds
 * - Correlation ID
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function requestLogger(
  req: Request,
  res: ResponseWithTime,
  next: NextFunction,
): void {
  // Record start time
  const startTime = Date.now();
  res.locals.startTime = startTime;

  // Get correlation ID
  const correlationId = getCorrelationId();

  // Log incoming request
  logger.http('Incoming request', {
    method: req.method,
    path: req.path,
    query: sanitizeQuery(req.query),
    correlationId,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  // Log response when finished
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      correlationId,
    };

    // Use appropriate log level based on status code
    if (res.statusCode >= 500) {
      logger.error('Request completed with error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request completed with client error', logData);
    } else {
      logger.http('Request completed', logData);
    }
  });

  next();
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Sanitizes query parameters for logging.
 * Removes sensitive fields like passwords, tokens, etc.
 * 
 * @param query - Express query object
 * @returns Sanitized query object
 */
function sanitizeQuery(query: Request['query']): Record<string, string> {
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'api_key'];
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(query)) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'string') {
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.join(',');
    }
  }

  return sanitized;
}
