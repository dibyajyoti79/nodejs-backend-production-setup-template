/**
 * @fileoverview Custom application error classes
 *
 * Provides a hierarchy of error classes for consistent error handling
 * throughout the application. All errors extend the base AppError interface
 * and can be used with the error middleware.
 *
 * @module utils/errors
 *
 * @example
 * // Throwing an error in a service
 * if (!user) {
 *   throw new NotFoundError('User not found');
 * }
 *
 * // Throwing with validation errors
 * throw new BadRequestError('Invalid input', { email: 'Invalid email format' });
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Base interface for all application errors.
 * Extends the native Error interface with HTTP status code.
 */
export interface AppError extends Error {
  /** HTTP status code for the error response */
  readonly statusCode: number;
  /** Name of the error class */
  readonly name: string;
  /** Optional validation errors or additional details */
  readonly errors?: unknown;
}

/**
 * Type guard to check if an error is an AppError instance.
 * Used by error middleware to determine how to handle the error.
 *
 * @param error - The error to check
 * @returns True if the error is an AppError instance
 *
 * @example
 * if (isAppError(error)) {
 *   res.status(error.statusCode).json({ message: error.message });
 * }
 */
export function isAppError(error: unknown): error is AppError {
  return (
    error instanceof Error &&
    "statusCode" in error &&
    typeof (error as AppError).statusCode === "number"
  );
}

// ============================================================================
// Base Error Class
// ============================================================================

/**
 * Abstract base class for all application errors.
 * Provides common functionality and ensures consistent structure.
 */
abstract class BaseAppError extends Error implements AppError {
  override readonly name: string;
  readonly statusCode: number;
  readonly errors?: unknown;

  constructor(
    message: string,
    statusCode: number,
    name: string,
    errors?: unknown,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.name = name;
    this.errors = errors;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);

    // Capture stack trace (excludes constructor from stack)
    Error.captureStackTrace(this, this.constructor);
  }
}

// ============================================================================
// HTTP Error Classes
// ============================================================================

/**
 * Represents a Bad Request error (HTTP 400).
 * Used when the client sends invalid input or malformed request syntax.
 *
 * @example
 * throw new BadRequestError('Invalid email format');
 * throw new BadRequestError('Validation failed', { email: 'Required field' });
 */
export class BadRequestError extends BaseAppError {
  constructor(message: string, errors?: unknown) {
    super(message, 400, "BadRequestError", errors);
  }
}

/**
 * Represents an Unauthorized error (HTTP 401).
 * Used when authentication is required but missing or invalid.
 *
 * @example
 * throw new UnauthorizedError('Invalid credentials');
 */
export class UnauthorizedError extends BaseAppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, "UnauthorizedError");
  }
}

/**
 * Represents a Forbidden error (HTTP 403).
 * Used when the authenticated user lacks permission for the resource.
 *
 * @example
 * throw new ForbiddenError('Access denied to this resource');
 */
export class ForbiddenError extends BaseAppError {
  constructor(message: string = "Forbidden") {
    super(message, 403, "ForbiddenError");
  }
}

/**
 * Represents a Not Found error (HTTP 404).
 * Used when a requested resource does not exist.
 *
 * @example
 * throw new NotFoundError('User not found');
 */
export class NotFoundError extends BaseAppError {
  constructor(message: string) {
    super(message, 404, "NotFoundError");
  }
}

/**
 * Represents a Conflict error (HTTP 409).
 * Used when the request conflicts with current resource state.
 *
 * @example
 * throw new ConflictError('Email already exists');
 */
export class ConflictError extends BaseAppError {
  constructor(message: string) {
    super(message, 409, "ConflictError");
  }
}

/**
 * Represents an Unprocessable Entity error (HTTP 422).
 * Used for semantic validation errors.
 *
 * @example
 * throw new UnprocessableEntityError('Invalid business logic');
 */
export class UnprocessableEntityError extends BaseAppError {
  constructor(message: string, errors?: unknown) {
    super(message, 422, "UnprocessableEntityError", errors);
  }
}

/**
 * Represents an Internal Server Error (HTTP 500).
 * Used for unexpected server-side errors.
 *
 * @example
 * throw new InternalServerError('Database connection failed');
 */
export class InternalServerError extends BaseAppError {
  constructor(message: string = "Internal Server Error") {
    super(message, 500, "InternalServerError");
  }
}

/**
 * Represents a Not Implemented error (HTTP 501).
 * Used when a feature is not yet implemented.
 *
 * @example
 * throw new NotImplementedError('Feature coming soon');
 */
export class NotImplementedError extends BaseAppError {
  constructor(message: string = "Not Implemented") {
    super(message, 501, "NotImplementedError");
  }
}

/**
 * Represents a Bad Gateway error (HTTP 502).
 * Used when an upstream service is unavailable.
 *
 * @example
 * throw new BadGatewayError('Payment service unavailable');
 */
export class BadGatewayError extends BaseAppError {
  constructor(message: string = "Bad Gateway") {
    super(message, 502, "BadGatewayError");
  }
}

/**
 * Represents a Service Unavailable error (HTTP 503).
 * Used when the service is temporarily unavailable.
 *
 * @example
 * throw new ServiceUnavailableError('Service under maintenance');
 */
export class ServiceUnavailableError extends BaseAppError {
  constructor(message: string = "Service Unavailable") {
    super(message, 503, "ServiceUnavailableError");
  }
}
