# � Node.js Backend Template

A production-ready **Node.js backend template** built with **Express, TypeScript, MongoDB, and Redis**. Features structured logging, correlation IDs, comprehensive error handling, and security best practices.

---

## ✨ Features

- **TypeScript** - Full type safety with strict configuration
- **Express 5** - Modern web framework with async error handling
- **MongoDB & Mongoose** - Database with connection pooling and retry logic
- **Redis** - Caching layer for improved performance
- **Winston Logger** - Structured logging with daily rotation
- **Correlation IDs** - Distributed request tracing
- **Security Middleware** - Helmet, CORS, Rate limiting
- **Graceful Shutdown** - Zero-downtime deployments
- **Error Handling** - Centralized error handling with custom error classes
- **Environment Validation** - Zod-based config validation
- **API Response Utilities** - Consistent response formatting

---

## 🛠️ Tech Stack

| Category   | Technology                       |
| ---------- | -------------------------------- |
| Runtime    | Node.js 18+                      |
| Language   | TypeScript 5.8                   |
| Framework  | Express 5                        |
| Database   | MongoDB with Mongoose            |
| Cache      | Redis                            |
| Validation | Zod                              |
| Logging    | Winston                          |
| Security   | Helmet, CORS, express-rate-limit |

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
│   └── .gitkeep
│
├── dtos/                      # Data Transfer Objects
│   └── .gitkeep
│
├── middlewares/               # Express middlewares
│   ├── correlation.middleware.ts    # Request correlation IDs
│   ├── error.middleware.ts          # Error handling
│   ├── request-logging.middleware.ts # HTTP request logging
│   └── security.middleware.ts       # Helmet, CORS, rate limiting
│
├── models/                    # Mongoose models
│   └── .gitkeep
│
├── repositories/              # Data access layer
│   └── .gitkeep
│
├── routes/                    # API routes
│   └── v1/                    # Version 1 routes
│       └── .gitkeep
│
├── services/                  # Business logic layer
│   └── .gitkeep
│
├── utils/                     # Utility functions
│   ├── errors/                # Custom error classes
│   │   └── app.error.ts
│   └── helpers/               # Helper utilities
│       ├── request.helpers.ts # AsyncLocalStorage for request context
│       └── response.helpers.ts # Standardized API responses
│
└── server.ts                  # Application entry point
```

---

## ⚡ Quick Start

### 1️⃣ Clone & Install

```bash
git clone https://github.com/dibyajyoti79/url_shortner_backend.git
cd url_shortner_backend
npm install
```

### 2️⃣ Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
NODE_ENV=development
PORT=4000
BASE_URL=http://localhost:4000
MONGO_URI=mongodb://localhost:27017/urlshortener
REDIS_URL=redis://localhost:6379
REDIS_COUNTER_KEY=url_counter
```

### 3️⃣ Start Services

Run MongoDB and Redis using Docker:

```bash
# MongoDB
docker run -d -p 27017:27017 --name mongo mongo:latest

# Redis
docker run -d -p 6379:6379 --name redis redis:latest
```

### 4️⃣ Run the Server

```bash
# Development (with hot reload)
npm run dev

# Production build
npm run build
npm start
```

Server will be available at: `http://localhost:4000`

---

## � Available Scripts

| Script             | Description                              |
| ------------------ | ---------------------------------------- |
| `npm run dev`      | Start development server with hot reload |
| `npm run build`    | Compile TypeScript to JavaScript         |
| `npm start`        | Run production server from compiled code |
| `npm run clean`    | Remove build artifacts                   |
| `npm run lint`     | Run ESLint (requires setup)              |
| `npm run lint:fix` | Fix ESLint issues (requires setup)       |

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
return res
  .status(200)
  .json(ApiResponse.success(data, "Users fetched successfully"));

// Paginated response
return res
  .status(200)
  .json(ApiResponse.paginated(users, { page: 1, limit: 10, total: 100 }));
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
MONGO_URI=mongodb+srv://...
REDIS_URL=redis://...
BASE_URL=https://api.yourdomain.com
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

---

## 🧪 Testing (Setup Required)

```bash
# Install testing dependencies
npm install -D jest @types/jest ts-jest supertest @types/supertest

# Run tests
npm test
```

---

## 📝 License

MIT License - feel free to use for personal or commercial projects.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📧 Support

For questions or issues, please open a GitHub issue.
