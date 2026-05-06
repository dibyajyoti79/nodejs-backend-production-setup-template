/**
 * @fileoverview Express application configuration
 *
 * This module configures the Express application with all middleware,
 * routes, and error handlers. It exports the app instance for use
 * in server.ts and testing.
 *
 * @module app
 *
 * @example
 * // In server.ts
 * import app from './app';
 * app.listen(PORT, () => console.log('Server started'));
 *
 * // In tests
 * import request from 'supertest';
 * import app from './app';
 * const response = await request(app).get('/health');
 */
import express from "express";

import { serverConfig } from "./config";
import { attachCorrelationIdMiddleware } from "./middlewares/correlation.middleware";
import {
  appErrorHandler,
  genericErrorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware";
import { requestLogger } from "./middlewares/request-logging.middleware";
import { setupSecurityMiddleware } from "./middlewares/security.middleware";

// ============================================================================
// Express Application Setup
// ============================================================================

/**
 * Express application instance.
 * Configured with all middleware and routes.
 */
const app = express();

// ============================================================================
// Middleware Configuration
// ============================================================================

// Trust proxy (useful when behind load balancers like nginx, AWS ALB)
app.set("trust proxy", 1);

// Security middleware (helmet, cors, rate limiting)
setupSecurityMiddleware(app);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request correlation ID (must be early in the chain)
app.use(attachCorrelationIdMiddleware);

// Request logging
app.use(requestLogger);

// ============================================================================
// Routes
// ============================================================================

// Health check endpoint (useful for load balancers and monitoring)
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: serverConfig.NODE_ENV,
  });
});

// API routes will be registered here
// Example: app.use('/api/v1', apiRoutes);

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Application error handler (handles known AppError instances)
app.use(appErrorHandler);

// Generic error handler (catch-all for unexpected errors)
app.use(genericErrorHandler);

// ============================================================================
// Export
// ============================================================================

export default app;
