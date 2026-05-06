# Node.js Backend Production Template

[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.2-black?logo=express)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A production-ready **Node.js backend template** built with **Express, TypeScript, and MongoDB**. Features structured logging, correlation IDs, comprehensive error handling, and security best practices.

---

## Table of Contents

- [Features](#-features)
- [Tech Stack](#%EF%B8%8F-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Available Scripts](#-available-scripts)
- [Environment Variables](#-environment-variables)
- [Security Features](#-security-features)
- [Logging](#-logging)
- [Request Tracing](#-request-tracing)
- [Error Handling](#%EF%B8%8F-error-handling)
- [API Response Format](#-api-response-format)
- [Health Check](#-health-check)
- [Production Deployment](#-production-deployment)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

- **TypeScript** - Full type safety with strict configuration
- **Express 5** - Modern web framework with async error handling
- **MongoDB & Mongoose** - Database with connection pooling and retry logic
- **Winston Logger** - Structured logging with daily rotation
- **Correlation IDs** - Distributed request tracing
- **Security Middleware** - Helmet, CORS, Rate limiting
- **Graceful Shutdown** - Zero-downtime deployments
- **Error Handling** - Centralized error handling with custom error classes
- **Environment Validation** - Zod-based config validation
- **API Response Utilities** - Consistent response formatting
- **Code Quality** - ESLint, Prettier, Husky, lint-staged

---

## 🛠️ Tech Stack

| Category   | Technology                       |
| ---------- | -------------------------------- |
| Runtime    | Node.js 18+                      |
| Language   | TypeScript 6.0                   |
| Framework  | Express 5.2                      |
| Database   | MongoDB with Mongoose 9          |
| Validation | Zod 4                            |
| Logging    | Winston 3                        |
| Security   | Helmet, CORS, express-rate-limit |
| Linting    | ESLint 10, Prettier 3            |

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0
- **npm** or **yarn**
- **MongoDB** (local or remote instance)
- **Git**

---

## ⚡ Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/dibyajyoti79/nodejs-backend-production-setup-template.git
cd nodejs-backend-production-setup-template
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=4000
MONGO_URI=mongodb://localhost:27017/your-database-name
```

### 3. Start MongoDB

Run MongoDB using Docker:

```bash
docker run -d -p 27017:27017 --name mongo mongo:latest
```

Or use your local MongoDB installation.

### 4. Run the Server

```bash
# Development (with hot reload)
npm run dev

# Production build
npm run build
npm start
```

Server will be available at: `http://localhost:4000`

---

## 📂 Project Structure

```
src/
├── config/                    # Configuration files
│   ├── index.ts               # Environment validation & export
│   ├── db.ts                  # MongoDB connection with retry logic
│   └── logger.config.ts       # Winston logger configuration
│
├── controllers/               # Request handlers (route logic)
│
├── dtos/                      # Data Transfer Objects
│
├── middlewares/               # Express middlewares
│   ├── correlation.middleware.ts    # Request correlation IDs
│   ├── error.middleware.ts          # Error handling
│   ├── request-logging.middleware.ts # HTTP request logging
│   └── security.middleware.ts       # Helmet, CORS, rate limiting
│
├── models/                    # Mongoose models
│
├── repositories/              # Data access layer
│
├── routes/                    # API routes
│   └── v1/                    # Version 1 routes
│
├── services/                  # Business logic layer
│
├── utils/                     # Utility functions
│   ├── errors/                # Custom error classes
│   │   └── app.error.ts
│   └── helpers/               # Helper utilities
│       ├── request.helpers.ts # AsyncLocalStorage for request context
│       └── response.helpers.ts # Standardized API responses
│
├── app.ts                     # Express app configuration
└── server.ts                  # Application entry point
```

---

## 📜 Available Scripts

| Script             | Description                              |
| ------------------ | ---------------------------------------- |
| `npm run dev`      | Start development server with hot reload |
| `npm run build`    | Compile TypeScript to JavaScript         |
| `npm start`        | Run production server from compiled code |
| `npm run clean`    | Remove build artifacts (`dist/`)         |
| `npm run lint`     | Run ESLint on all files                  |
| `npm run lint:fix` | Fix ESLint issues automatically          |
| `npm run format`   | Format code with Prettier                |

---

## 🔧 Environment Variables

| Variable    | Description                                   | Required | Default       |
| ----------- | --------------------------------------------- | -------- | ------------- |
| `NODE_ENV`  | Application environment                       | No       | `development` |
| `PORT`      | Server port (1-65535)                         | No       | `4000`        |
| `MONGO_URI` | MongoDB connection string (must be valid URL) | Yes      | -             |

---

## 🔒 Security Features

### HTTP Headers (Helmet)

- Content Security Policy
- XSS Protection
- Frame Options
- HSTS (HTTP Strict Transport Security)

### CORS Configuration

- Configurable allowed origins
- Credentials support
- Pre-flight caching

### Rate Limiting

- General API: 100 requests per 15 minutes
- Strict (auth): 5 requests per 15 minutes
- Configurable limits

---

## 📊 Logging

### Structured JSON Logs

```json
{
  "level": "info",
  "message": "Server started successfully",
  "timestamp": "2024-01-15 10:30:00",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "port": 4000,
  "environment": "development"
}
```

### Log Files

- `logs/YYYY-MM-DD-app.log` - All logs
- `logs/YYYY-MM-DD-error.log` - Error logs only
- Automatic rotation and compression
- 14-day retention (30 days for errors)

---

## 🔍 Request Tracing

Every request gets a unique correlation ID:

1. **Incoming**: Check for existing `x-correlation-id` header
2. **Generate**: Create new UUID if not present
3. **Store**: Use AsyncLocalStorage for context
4. **Response**: Include in response headers
5. **Logs**: Automatically included in all log entries

---

## ⚠️ Error Handling

### Custom Error Classes

```typescript
import { BadRequestError, NotFoundError } from "./utils/errors/app.error";

// In your controller
if (!user) {
  throw new NotFoundError("User not found");
}

// With validation errors
throw new BadRequestError("Invalid input", { email: "Invalid format" });
```

### Error Response Format

```json
{
  "success": false,
  "message": "User not found",
  "statusCode": 404,
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## 📡 API Response Format

### Success Response

```typescript
import { ApiResponse } from "./utils/helpers/response.helpers";

// Simple success
return res.status(200).json(ApiResponse.success(data, "Users fetched successfully"));

// Paginated response
return res.status(200).json(ApiResponse.paginated(users, { page: 1, limit: 10, total: 100 }));
```

### Response Structure

```json
{
  "success": true,
  "data": { ... },
  "message": "Users fetched successfully",
  "correlationId": "...",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## 🏥 Health Check

```bash
GET /health
```

Response:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development"
}
```

---

## 🚢 Production Deployment

### Build

```bash
npm run build
```

### Environment Variables

Ensure all production values are set:

```env
NODE_ENV=production
PORT=4000
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/database
```

### Process Management

Use PM2 for production:

```bash
npm install -g pm2
pm2 start dist/server.js --name api
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 4000
CMD ["node", "dist/server.js"]
```

Build and run:

```bash
docker build -t nodejs-backend .
docker run -p 4000:4000 --env-file .env nodejs-backend
```

---

## 🧪 Testing

```bash
# Install testing dependencies
npm install -D jest @types/jest ts-jest supertest @types/supertest

# Run tests
npm test
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📧 Support

For questions or issues, please [open a GitHub issue](https://github.com/your-username/nodejs-backend-template/issues).
