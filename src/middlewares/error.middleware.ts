/**
 * @fileoverview Express error handling middleware
 *
 * Provides centralized error handling for the entire application.
 * Catches both custom application errors and unexpected errors,
 * returning consistent API responses.
 *
 * @module middlewares/error
 *
 * @example
 * // In your route handler
 * throw new NotFoundError('User not found');
 *
 * // Response will be:
 * // { "success": false, "message": "User not found", "statusCode": 404 }
 */

import { NextFunction, Request, Response } from "express";

import { serverConfig } from "../config";
import logger from "../config/logger.config";
import { AppError, isAppError } from "../utils/errors/app.error";
import { getCorrelationId } from "../utils/helpers/request.helpers";

// ============================================================================
// Types
// ============================================================================

/**
 * Standard API error response structure.
 * Ensures consistent error format across all endpoints.
 */
interface ErrorResponse {
  success: false;
  message: string;
  statusCode: number;
  correlationId?: string | undefined;
  stack?: string | undefined;
  errors?: unknown;
}

// ============================================================================
// Error Handlers
// ============================================================================

/**
 * Handles known application errors (AppError instances).
 *
 * This middleware catches custom errors like BadRequestError, NotFoundError, etc.
 * and returns appropriate HTTP status codes and messages.
 *
 * @param err - The error object (should be an AppError instance)
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const appErrorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Skip if this isn't an AppError
  if (!isAppError(err)) {
    next(err);
    return;
  }

  const correlationId = getCorrelationId();

  // Log the error with context
  logger.error("Application error occurred", {
    error: err.message,
    name: err.name,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    correlationId,
    stack: err.stack,
  });

  // Build error response
  const response: ErrorResponse = {
    success: false,
    message: err.message,
    statusCode: err.statusCode,
    correlationId:
      correlationId !== "unknown-correlation-id" ? correlationId : undefined,
  };

  // Include stack trace in development
  if (serverConfig.isDevelopment) {
    response.stack = err.stack;
  }

  // Include validation errors if present
  if (err.errors) {
  response.errors = err.errors;
}

  res.status(err.statusCode).json(response);
};

/**
 * Handles unexpected/unhandled errors.
 *
 * This is the catch-all error handler for any errors that aren't
 * AppError instances. Returns a generic 500 error to avoid leaking
 * internal details to clients.
 *
 * @param err - The error object
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const genericErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const correlationId = getCorrelationId();

  // Log the unexpected error with full details
  logger.error("Unexpected error occurred", {
    error: err.message,
    name: err.name,
    path: req.path,
    method: req.method,
    correlationId,
    stack: err.stack,
    body: req.body,
    query: req.query,
    params: req.params,
  });

  // Build generic error response (don't expose internal details)
  const response: ErrorResponse = {
    success: false,
    message: serverConfig.isProduction ? "Internal Server Error" : err.message,
    statusCode: 500,
    correlationId:
      correlationId !== "unknown-correlation-id" ? correlationId : undefined,
  };

  // Include stack trace in development
  if (serverConfig.isDevelopment) {
    response.stack = err.stack;
  }

  res.status(500).json(response);
};

/**
 * Handles 404 Not Found errors for undefined routes.
 * Should be registered after all other routes.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const correlationId = getCorrelationId();

  logger.warn("Route not found", {
    path: req.path,
    method: req.method,
    correlationId,
  });

  const response: ErrorResponse = {
    success: false,
    message: `Cannot ${req.method} ${req.path}`,
    statusCode: 404,
    correlationId:
      correlationId !== "unknown-correlation-id" ? correlationId : undefined,
  };

  res.status(404).json(response);
};
