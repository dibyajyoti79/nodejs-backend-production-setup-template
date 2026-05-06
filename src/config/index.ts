/* eslint-disable no-console */
/**
 * @fileoverview Application configuration module
 *
 * This module handles loading and validation of environment variables.
 * It provides a centralized configuration object for the entire application.
 *
 * @module config
 *
 * @example
 * // Import and use configuration
 * import { serverConfig } from './config';
 * console.log(serverConfig.PORT);
 */

import dotenv from "dotenv";
import { z } from "zod";

// ============================================================================
// Environment Schema Definition
// ============================================================================

/**
 * Zod schema for validating environment variables.
 * Ensures all required variables are present and have correct types.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform(Number).pipe(z.number().int().positive().max(65535)),
  MONGO_URI: z.string().url({ message: "MONGO_URI must be a valid MongoDB connection string" }),
});

// ============================================================================
// Types
// ============================================================================

/**
 * Application configuration interface.
 * Represents all configuration values needed by the application.
 */
export type ServerConfig = z.infer<typeof envSchema>;

/**
 * Extended configuration with computed values
 */
export interface AppConfig extends ServerConfig {
  /** Whether the app is running in production mode */
  readonly isProduction: boolean;
  /** Whether the app is running in development mode */
  readonly isDevelopment: boolean;
  /** Whether the app is running in test mode */
  readonly isTest: boolean;
}

// ============================================================================
// Environment Loading
// ============================================================================

/**
 * Loads environment variables from .env file.
 * Should be called once at application startup.
 */
function loadEnv(): void {
  const result = dotenv.config();

  if (result.error) {
    console.warn("No .env file found, using system environment variables");
  } else {
    console.info("Environment variables loaded from .env file");
  }
}

// Load environment variables before validation
loadEnv();

// ============================================================================
// Configuration Validation & Export
// ============================================================================

/**
 * Validates environment variables against the schema.
 * Exits the process if validation fails.
 */
function validateEnv(): AppConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues.map((e) => `  - ${e.path.join(".")}: ${e.message}`);

    console.error("Environment validation failed:\n" + errors.join("\n"));
    process.exit(1);
  }

  const config = result.data;

  return {
    ...config,
    isProduction: config.NODE_ENV === "production",
    isDevelopment: config.NODE_ENV === "development",
    isTest: config.NODE_ENV === "test",
  };
}

/**
 * Application configuration object.
 * Contains all validated environment variables and computed values.
 *
 * @example
 * if (serverConfig.isProduction) {
 *   // Enable production-only features
 * }
 */
export const serverConfig: AppConfig = validateEnv();
