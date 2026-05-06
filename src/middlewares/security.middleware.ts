/**
 * @fileoverview Security middleware configuration
 *
 * Provides production-ready security middleware including:
 * - Helmet for HTTP security headers
 * - CORS for cross-origin resource sharing
 * - Rate limiting for DDoS protection
 *
 * @module middlewares/security
 *
 * @example
 * // In server.ts
 * import { setupSecurityMiddleware } from './middlewares/security.middleware';
 * setupSecurityMiddleware(app);
 */

import cors from "cors";
import { Express } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

import { serverConfig } from "../config";
import logger from "../config/logger.config";

// ============================================================================
// Rate Limiter Configuration
// ============================================================================

/**
 * General API rate limiter.
 * Limits requests per IP to prevent abuse.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
    statusCode: 429,
  },
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  // Skip rate limiting in test environment
  skip: () => serverConfig.isTest,
});

/**
 * Strict rate limiter for sensitive endpoints.
 * Use for authentication, password reset, etc.
 */
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 requests per 15 minutes
  message: {
    success: false,
    message: "Too many attempts, please try again after 15 minutes.",
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => serverConfig.isTest,
});

// ============================================================================
// CORS Configuration
// ============================================================================

/**
 * CORS configuration options.
 * Adjust origins based on your production needs.
 */
const corsOptions: cors.CorsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      callback(null, true);
      return;
    }

    // In development, allow all origins
    if (serverConfig.isDevelopment) {
      callback(null, true);
      return;
    }

    // In production, configure allowed origins
    // TODO: Add your production domains to allowedOrigins
    const allowedOrigins = [
      "https://yourdomain.com",
      "https://www.yourdomain.com",
    ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Allow cookies and authorization headers
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "x-correlation-id",
  ],
  exposedHeaders: ["x-correlation-id"],
  maxAge: 86400, // Cache preflight request for 24 hours
};

// ============================================================================
// Security Middleware Setup
// ============================================================================

/**
 * Configures all security middleware on the Express app.
 * Should be called early in the middleware chain.
 *
 * @param app - Express application instance
 *
 * @example
 * const app = express();
 * setupSecurityMiddleware(app);
 */
export function setupSecurityMiddleware(app: Express): void {
  // Helmet: Sets various HTTP headers for security
  // Protects against well-known web vulnerabilities
  app.use(
    helmet({
      contentSecurityPolicy: serverConfig.isProduction, // Enable CSP in production
      crossOriginEmbedderPolicy: false, // May need adjustment based on your needs
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  // CORS: Enable cross-origin requests
  app.use(cors(corsOptions));

  // Rate limiting: Apply to all API routes
  app.use("/api", apiLimiter);

  // Log security middleware setup
  logger.info("Security middleware configured");
}

/**
 * Strict rate limiter for specific routes.
 * Use for authentication endpoints, password reset, etc.
 *
 * @example
 * // In your auth routes
 * router.post('/login', strictRateLimiter, loginController);
 */
export const strictRateLimiter = strictLimiter;

/**
 * General rate limiter for specific routes.
 * Useful when you want rate limiting on specific endpoints only.
 *
 * @example
 * // In your routes
 * router.get('/search', apiRateLimiter, searchController);
 */
export const apiRateLimiter = apiLimiter;
