/**
 * @fileoverview Request context utilities using AsyncLocalStorage
 *
 * Provides async context storage for request-scoped data like
 * correlation IDs. This allows access to request context anywhere
 * in the call stack without passing it explicitly.
 *
 * @module utils/helpers/request
 *
 * @example
 * // Get correlation ID anywhere in the request lifecycle
 * import { getCorrelationId } from './request.helpers';
 * const correlationId = getCorrelationId();
 */

import { AsyncLocalStorage } from "async_hooks";

// ============================================================================
// Types
// ============================================================================

/**
 * Storage type for request-scoped data.
 * Currently only contains correlation ID, but can be extended.
 */
export interface AsyncLocalStorageType {
  /** Unique identifier for request tracing */
  correlationId: string;
}

// ============================================================================
// AsyncLocalStorage Instance
// ============================================================================

/**
 * Global AsyncLocalStorage instance for request context.
 *
 * This is a Node.js API that allows storing data that is
 * accessible throughout the async call stack of a request.
 *
 * @see https://nodejs.org/api/async_context.html
 */
export const asyncLocalStorage = new AsyncLocalStorage<AsyncLocalStorageType>();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Retrieves the correlation ID from the current async context.
 *
 * Returns 'unknown-correlation-id' if called outside a request context
 * or if the context is not properly initialized.
 *
 * @returns The correlation ID string
 *
 * @example
 * // In any service or utility function
 * const correlationId = getCorrelationId();
 * logger.info('Processing', { correlationId });
 */
export const getCorrelationId = (): string => {
  const asyncStore = asyncLocalStorage.getStore();
  return asyncStore?.correlationId ?? "unknown-correlation-id";
};

/**
 * Retrieves the entire async storage context.
 * Useful when you need access to all stored values.
 *
 * @returns The async storage object or undefined if not in a context
 *
 * @example
 * const context = getAsyncContext();
 * if (context) {
 *   console.log(context.correlationId);
 * }
 */
export const getAsyncContext = (): AsyncLocalStorageType | undefined => {
  return asyncLocalStorage.getStore();
};
