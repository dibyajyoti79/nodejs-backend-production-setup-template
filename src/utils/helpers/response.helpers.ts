/**
 * @fileoverview Standardized API response utilities
 *
 * Provides consistent response formatting across all API endpoints.
 * All responses follow a standard structure for predictability.
 *
 * @module utils/helpers/response
 *
 * @example
 * // In a controller
 * return res.status(200).json(
 *   ApiResponse.success(data, 'Users fetched successfully')
 * );
 */

import { getCorrelationId } from "./request.helpers";

// ============================================================================
// Types
// ============================================================================

/**
 * Standard success response structure.
 * All successful API responses should use this format.
 */
export interface SuccessResponse<T> {
  /** Always true for success responses */
  success: true;
  /** Response data payload */
  data: T;
  /** Human-readable success message */
  message: string;
  /** Correlation ID for request tracing */
  correlationId?: string;
  /** Pagination metadata (optional) */
  pagination?: PaginationMeta;
}

/**
 * Standard error response structure.
 * All error API responses should use this format.
 */
export interface ErrorResponse {
  /** Always false for error responses */
  success: false;
  /** Human-readable error message */
  message: string;
  /** HTTP status code */
  statusCode: number;
  /** Correlation ID for request tracing */
  correlationId?: string;
  /** Validation errors or additional details */
  errors?: unknown;
}

/**
 * Pagination metadata for list responses.
 */
export interface PaginationMeta {
  /** Current page number */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Total number of items */
  total: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a next page */
  hasNextPage: boolean;
  /** Whether there is a previous page */
  hasPrevPage: boolean;
}

// ============================================================================
// Response Builder Class
// ============================================================================

/**
 * Static class for building standardized API responses.
 * Provides methods for success, error, and paginated responses.
 *
 * @example
 * // Success response
 * ApiResponse.success({ id: 1 }, 'Created successfully');
 *
 * // Paginated response
 * ApiResponse.paginated(users, { page: 1, limit: 10, total: 100 });
 */
export class ApiResponse {
  /**
   * Creates a success response object.
   *
   * @param data - The response data payload
   * @param message - Success message (default: 'Success')
   * @returns Formatted success response object
   *
   * @example
   * ApiResponse.success({ user: { id: 1 } }, 'User created');
   * // { success: true, data: { user: { id: 1 } }, message: 'User created', correlationId: '...' }
   */
  static success<T>(data: T, message = "Success"): SuccessResponse<T> {
    const correlationId = getCorrelationId();

    return {
      success: true,
      data,
      message,
      ...(correlationId !== "unknown-correlation-id" && { correlationId }),
    };
  }

  /**
   * Creates a success response with pagination metadata.
   * Use for list endpoints that support pagination.
   *
   * @param data - Array of items for current page
   * @param meta - Pagination metadata
   * @param message - Success message (default: 'Data fetched successfully')
   * @returns Formatted success response with pagination
   *
   * @example
   * ApiResponse.paginated(users, { page: 1, limit: 10, total: 100 });
   */
  static paginated<T>(
    data: T[],
    meta: { page: number; limit: number; total: number },
    message = "Data fetched successfully",
  ): SuccessResponse<T[]> {
    const correlationId = getCorrelationId();
    const totalPages = Math.ceil(meta.total / meta.limit);

    const pagination: PaginationMeta = {
      page: meta.page,
      limit: meta.limit,
      total: meta.total,
      totalPages,
      hasNextPage: meta.page < totalPages,
      hasPrevPage: meta.page > 1,
    };

    return {
      success: true,
      data,
      message,
      pagination,
      ...(correlationId !== "unknown-correlation-id" && { correlationId }),
    };
  }

  /**
   * Creates an error response object.
   * Note: Usually errors are handled by error middleware, but this
   * can be useful for known business logic failures.
   *
   * @param message - Error message
   * @param statusCode - HTTP status code (default: 400)
   * @param errors - Additional error details
   * @returns Formatted error response object
   *
   * @example
   * ApiResponse.error('Validation failed', 400, { email: 'Invalid format' });
   */
  static error(
    message: string,
    statusCode = 400,
    errors?: unknown,
  ): ErrorResponse {
    const correlationId = getCorrelationId();

    const response: ErrorResponse = {
      success: false,
      message,
      statusCode,
    };

    if (correlationId !== "unknown-correlation-id") {
      response.correlationId = correlationId;
    }

    if (errors !== undefined) {
      response.errors = errors;
    }

    return response;
  }

  /**
   * Creates a created (201) response.
   * Use for POST endpoints that create new resources.
   *
   * @param data - The created resource
   * @param message - Success message (default: 'Resource created successfully')
   * @returns Formatted success response
   *
   * @example
   * ApiResponse.created({ id: 1, name: 'New User' });
   */
  static created<T>(
    data: T,
    message = "Resource created successfully",
  ): SuccessResponse<T> {
    return this.success(data, message);
  }

  /**
   * Creates a no-content style response for deletions.
   * Returns minimal info about the deleted resource.
   *
   * @param id - ID of the deleted resource
   * @param message - Success message (default: 'Resource deleted successfully')
   * @returns Formatted success response
   *
   * @example
   * ApiResponse.deleted('123');
   */
  static deleted(
    id: string,
    message = "Resource deleted successfully",
  ): SuccessResponse<{ id: string }> {
    return this.success({ id }, message);
  }
}
