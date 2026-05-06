/**
 * @fileoverview Winston logger configuration module
 *
 * Provides a centralized, production-ready logging system with:
 * - Structured JSON logging for production
 * - Pretty-printed console logs for development
 * - Daily rotating log files with retention policy
 * - Correlation ID integration for request tracing
 *
 * @module config/logger
 *
 * @example
 * import logger from './config/logger.config';
 * logger.info('User logged in', { userId: '123' });
 */

import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

import { getCorrelationId } from "../utils/helpers/request.helpers";
import { serverConfig } from "./index";
// ============================================================================
// Constants
// ============================================================================

/** Log levels following syslog severity levels */
const LOG_LEVELS: winston.config.AbstractConfigSetLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  verbose: 5,
  silly: 6,
};

/** Log colors for console output */
const LOG_COLORS: winston.config.AbstractConfigSetColors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
  verbose: "cyan",
  silly: "gray",
};

// Apply colors to winston
winston.addColors(LOG_COLORS);

// ============================================================================
// Format Functions
// ============================================================================

/**
 * Custom format that includes correlation ID in every log entry.
 * Extracts correlation ID from AsyncLocalStorage if available.
 */
const correlationFormat = winston.format((info) => {
  const correlationId = getCorrelationId();
  info["correlationId"] = correlationId;
  return info;
});

/**
 * Production format: JSON structured logs with all metadata.
 * Optimized for log aggregation systems (ELK, Datadog, etc.)
 */
const productionFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  correlationFormat(),
  winston.format.json(),
);

/**
 * Development format: Pretty-printed colored console output.
 * Easy to read during local development.
 */
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  correlationFormat(),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ level, message, timestamp, ...rest }) => {
    // Extract correlation ID from rest object
    const correlationId = rest["correlationId"] as string | undefined;
    const metadata = Object.fromEntries(
      Object.entries(rest).filter(([key]) => key !== "correlationId"),
    );

    // Build the log message string
    let log = `[${timestamp}] ${level}: ${message}`;

    // Add correlation ID if available
    if (correlationId && correlationId !== "unknown-correlation-id") {
      log += ` [${correlationId}]`;
    }

    // Add metadata if present
    const metaKeys = Object.keys(metadata);
    if (metaKeys.length > 0) {
      // Filter out internal winston properties
      const filteredMeta = metaKeys.reduce(
        (acc, key) => {
          if (!["Symbol(level)", "Symbol(message)"].includes(key)) {
            acc[key] = metadata[key];
          }
          return acc;
        },
        {} as Record<string, unknown>,
      );

      if (Object.keys(filteredMeta).length > 0) {
        log += ` ${JSON.stringify(filteredMeta)}`;
      }
    }

    return log;
  }),
);

// ============================================================================
// Transport Configuration
// ============================================================================

/**
 * Console transport configuration.
 * Always enabled for immediate visibility.
 */
const consoleTransport = new winston.transports.Console({
  level: serverConfig.isProduction ? "info" : "debug",
  handleExceptions: true,
  handleRejections: true,
});

/**
 * Daily rotating file transport for application logs.
 * Creates a new log file each day and maintains a 14-day history.
 */
const fileTransport = new DailyRotateFile({
  filename: "logs/%DATE%-app.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
  level: "info",
  handleExceptions: true,
  handleRejections: true,
});

/**
 * Separate transport for error logs.
 * Ensures errors are always captured for debugging.
 */
const errorFileTransport = new DailyRotateFile({
  filename: "logs/%DATE%-error.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "30d",
  level: "error",
  handleExceptions: true,
  handleRejections: true,
});

// ============================================================================
// Logger Instance
// ============================================================================

/**
 * Winston logger instance configured for the application.
 *
 * Usage:
 * - logger.info() - General information
 * - logger.warn() - Warning conditions
 * - logger.error() - Error conditions
 * - logger.debug() - Debug information (development only)
 * - logger.http() - HTTP request/response logging
 */
const logger = winston.createLogger({
  levels: LOG_LEVELS,
  level: serverConfig.isProduction ? "info" : "debug",
  format: serverConfig.isProduction ? productionFormat : developmentFormat,
  transports: [consoleTransport, fileTransport, errorFileTransport],
  exitOnError: false, // Do not exit on handled exceptions
  defaultMeta: {
    service: "nodejs-backend-template",
    environment: serverConfig.NODE_ENV,
  },
});

// ============================================================================
// Stream for Morgan HTTP Logger (if needed)
// ============================================================================

/**
 * Stream object for integrating with HTTP logging middleware.
 * @example
 * import { loggerStream } from './config/logger.config';
 * app.use(morgan('combined', { stream: loggerStream }));
 */
export const loggerStream = {
  write: (message: string): void => {
    logger.http(message.trim());
  },
};

// ============================================================================
// Export
// ============================================================================

export default logger;
