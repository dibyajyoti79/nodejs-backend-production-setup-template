/**
 * @fileoverview MongoDB database connection module
 *
 * Handles MongoDB connection lifecycle including:
 * - Initial connection with retry logic
 * - Connection event monitoring
 * - Graceful disconnection on shutdown
 *
 * @module config/db
 */

import mongoose from "mongoose";

import { serverConfig } from ".";
import logger from "./logger.config";

// ============================================================================
// Types
// ============================================================================

/** Connection state tracking */
interface ConnectionState {
  isConnected: boolean;
  isShuttingDown: boolean;
  retryCount: number;
  maxRetries: number;
  retryIntervalMs: number;
}

// ============================================================================
// Constants
// ============================================================================

/** Connection state singleton */
const connectionState: ConnectionState = {
  isConnected: false,
  isShuttingDown: false,
  retryCount: 0,
  maxRetries: 5,
  retryIntervalMs: 5000,
};

// ============================================================================
// Connection Event Handlers
// ============================================================================

/**
 * Sets up MongoDB connection event listeners.
 * Monitors connection health and logs important events.
 */
function setupConnectionEvents(): void {
  mongoose.connection.on("connected", () => {
    connectionState.isConnected = true;
    connectionState.retryCount = 0;
    logger.info("MongoDB connection established", {
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      database: mongoose.connection.name,
    });
  });

  mongoose.connection.on("disconnected", () => {
    connectionState.isConnected = false;
    // Only warn if this wasn't an intentional shutdown
    if (!connectionState.isShuttingDown) {
      logger.warn("MongoDB connection lost");
    }
  });

  mongoose.connection.on("error", (error: Error) => {
    logger.error("MongoDB connection error", {
      error: error.message,
      stack: error.stack,
    });
  });

  mongoose.connection.on("reconnected", () => {
    logger.info("MongoDB reconnected successfully");
  });

  // Log when connection is being closed
  mongoose.connection.on("close", () => {
    logger.info("MongoDB connection closed");
  });
}

// ============================================================================
// Connection Functions
// ============================================================================

/**
 * Attempts to connect to MongoDB with retry logic.
 *
 * @throws {Error} If connection fails after max retries
 */
async function connectWithRetry(): Promise<void> {
  while (connectionState.retryCount < connectionState.maxRetries) {
    try {
      await mongoose.connect(serverConfig.MONGO_URI, {
        // Connection options for better reliability
        serverSelectionTimeoutMS: 10000, // Timeout for server selection
        socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        connectTimeoutMS: 10000, // Connection timeout
        maxPoolSize: 10, // Maximum number of sockets in the connection pool
        minPoolSize: 2, // Minimum number of sockets
      });
      return;
    } catch (error) {
      connectionState.retryCount++;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error("MongoDB connection attempt failed", {
        attempt: connectionState.retryCount,
        maxRetries: connectionState.maxRetries,
        error: errorMessage,
      });

      if (connectionState.retryCount >= connectionState.maxRetries) {
        logger.error("Max connection retries reached. Exiting...");
        throw error;
      }

      // Wait before retrying
      await new Promise((resolve) =>
        setTimeout(resolve, connectionState.retryIntervalMs),
      );
    }
  }
}

/**
 * Establishes connection to MongoDB.
 * Should be called once during application startup.
 *
 * @example
 * // In server.ts
 * await connectDB();
 */
export async function connectDB(): Promise<void> {
  // Prevent multiple connections
  if (connectionState.isConnected) {
    logger.warn("MongoDB already connected, skipping...");
    return;
  }

  // Setup event handlers before connecting
  setupConnectionEvents();

  try {
    await connectWithRetry();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Failed to connect to MongoDB", { error: errorMessage });
    process.exit(1);
  }
}

/**
 * Gracefully disconnects from MongoDB.
 * Should be called during application shutdown.
 *
 * @example
 * // In shutdown handler
 * await disconnectDB();
 */
export async function disconnectDB(): Promise<void> {
  if (!connectionState.isConnected) {
    logger.warn("MongoDB not connected, skipping disconnect...");
    return;
  }

  // Mark as intentional shutdown to avoid misleading warning
  connectionState.isShuttingDown = true;

  try {
    await mongoose.connection.close();
    logger.info("MongoDB connection closed gracefully");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Error closing MongoDB connection", { error: errorMessage });
    throw error;
  }
}

/**
 * Returns current connection status.
 * Useful for health checks.
 */
export function isDBConnected(): boolean {
  return connectionState.isConnected && mongoose.connection.readyState === 1;
}

/**
 * Returns detailed connection info for health checks.
 */
export function getConnectionInfo(): {
  isConnected: boolean;
  readyState: number;
  host: string | undefined;
  port: number | undefined;
  database: string | undefined;
} {
  return {
    isConnected: isDBConnected(),
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    database: mongoose.connection.name,
  };
}
