/**
 * @fileoverview Correlation ID middleware for request tracing
 *
 * Attaches a unique correlation ID to every incoming request.
 * This enables distributed tracing across services and makes
 * debugging easier by correlating logs from a single request.
 *
 * @module middlewares/correlation
 *
 * @example
 * // In server.ts
 * app.use(attachCorrelationIdMiddleware);
 *
 * // In logs, the correlation ID will be automatically included
 * logger.info('Processing request'); // Will include correlationId
 */

import { NextFunction, Request, Response } from "express";
import { v4 as uuidV4 } from "uuid";

import { asyncLocalStorage } from "../utils/helpers/request.helpers";

// ============================================================================
// Constants
// ============================================================================

/** Header name for correlation ID */
const CORRELATION_ID_HEADER = "x-correlation-id";

// ============================================================================
// Middleware
// ============================================================================

/**
 * Express middleware that attaches a correlation ID to each request.
 *
 * Behavior:
 * - If the request already has a correlation ID header, it will be preserved
 *   (useful for distributed tracing across services)
 * - If no correlation ID exists, a new UUID v4 is generated
 * - The correlation ID is stored in AsyncLocalStorage for access in any function
 * - The correlation ID is added to the response headers for client-side tracing
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 *
 * @example
 * // Access correlation ID anywhere in the request lifecycle
 * import { getCorrelationId } from '../utils/helpers/request.helpers';
 * const correlationId = getCorrelationId();
 */
export const attachCorrelationIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Check if correlation ID was passed from upstream service
  const existingCorrelationId = req.headers[CORRELATION_ID_HEADER];

  // Use existing ID or generate a new one
  const correlationId =
    typeof existingCorrelationId === "string" && existingCorrelationId
      ? existingCorrelationId
      : uuidV4();

  // Store in request headers for downstream access
  req.headers[CORRELATION_ID_HEADER] = correlationId;

  // Add to response headers so clients can trace the request
  res.setHeader(CORRELATION_ID_HEADER, correlationId);

  // Run the rest of the request lifecycle within AsyncLocalStorage context
  asyncLocalStorage.run({ correlationId }, () => {
    next();
  });
};
