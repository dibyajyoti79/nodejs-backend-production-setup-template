/**
 * @fileoverview Main server entry point
 *
 * This is the main entry point for the Node.js backend server.
 * It handles database connection, HTTP server startup, and graceful shutdown.
 *
 * @module server
 *
 * @example
 * // Start the server
 * npm run dev
 *
 * // Or in production
 * npm run build && npm start
 */
import { Server } from "http";

import app from "./app";
import { serverConfig } from "./config";
import { connectDB, disconnectDB } from "./config/db";
import logger from "./config/logger.config";

// ============================================================================
// Server Lifecycle
// ============================================================================

/**
 * Starts the HTTP server and establishes database connection.
 */
async function startServer(): Promise<void> {
  try {
    // Connect to database first
    await connectDB();

    // Start HTTP server
    const server = app.listen(serverConfig.PORT, () => {
      logger.info(`Server started successfully`, {
        port: serverConfig.PORT,
        environment: serverConfig.NODE_ENV,
      });

      if (serverConfig.isDevelopment) {
        logger.info(`API available at: http://localhost:${serverConfig.PORT}`);
        logger.info("Press Ctrl+C to stop the server");
      }
    });

    // Configure graceful shutdown
    setupGracefulShutdown(server);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Failed to start server", { error: errorMessage });
    process.exit(1);
  }
}

/**
 * Configures graceful shutdown handlers.
 * Ensures all connections are closed before exiting.
 *
 * @param server - HTTP server instance
 */
function setupGracefulShutdown(server: Server): void {
  let isShuttingDown = false;

  /**
   * Performs graceful shutdown.
   * Closes HTTP server and database connections.
   */
  async function shutdown(signal: string): Promise<void> {
    if (isShuttingDown) {
      logger.warn("Shutdown already in progress, ignoring signal", { signal });
      return;
    }

    isShuttingDown = true;
    logger.info(`Received ${signal}, starting graceful shutdown...`);

    // Set a timeout for forced shutdown
    const forceShutdownTimeout = setTimeout(() => {
      logger.error("Forced shutdown due to timeout");
      process.exit(1);
    }, 10000); // 10 seconds

    try {
      // Stop accepting new connections
      server.close(() => {
        logger.info("HTTP server closed");
      });

      // Close database connection
      await disconnectDB();

      clearTimeout(forceShutdownTimeout);
      logger.info("Graceful shutdown completed");
      process.exit(0);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Error during shutdown", { error: errorMessage });
      process.exit(1);
    }
  }

  // Handle termination signals
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // Handle uncaught exceptions
  process.on("uncaughtException", (error) => {
    logger.error("Uncaught exception", {
      error: error.message,
      stack: error.stack,
    });
    shutdown("uncaughtException");
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason, _promise) => {
    logger.error("Unhandled promise rejection", {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
    shutdown("unhandledRejection");
  });
}

// ============================================================================
// Start Server
// ============================================================================

// Start the server
startServer();
