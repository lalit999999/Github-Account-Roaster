import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import helmet from "helmet";

import { fileURLToPath } from 'url';
import { requestIdMiddleware } from './middleware/requestId.js';
import roastRoutes from './routes/roast.js';

// Get current directory (for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const result = dotenv.config({ path: envPath });
if (result.error) {
    console.warn(`⚠️  Warning: Could not load .env.local from ${envPath}`);
} else {
    console.log(`✓ Loaded environment from: ${envPath}`);
}

const app = express();
const PORT = process.env.PORT || 4001;

// ==================== MIDDLEWARE ====================

// CORS Configuration - secure and scoped
app.use(cors({
    origin: [
        process.env.FRONTEND_URL,
        "http://localhost:5173"
    ],
    credentials: true,
}));

app.use(helmet());

// Body size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// Request ID middleware - for tracing
app.use(requestIdMiddleware);

// ==================== ROUTES ====================

// Mount API routes
app.use('/api', roastRoutes);

// ==================== ERROR HANDLERS ====================

/**
 * 404 Handler - for undefined routes
 */
app.use((req, res) => {
    console.warn(`[${req.id}] 404 Not Found: ${req.method} ${req.path}`);
    res.status(404).json({
        error: {
            type: 'NOT_FOUND',
            message: `Endpoint ${req.method} ${req.path} not found`,
        },
    });
});

/**
 * Global error handler
 */
app.use((err, req, res, next) => {
    console.error(`[${req.id}] Global error handler:`, err);
    res.status(500).json({
        error: {
            type: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
            ...(process.env.NODE_ENV === 'development' && { details: err.message }),
        },
    });
});

// ==================== SERVER STARTUP ====================

const server = app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════╗
║   GitHub Roast API Server                          ║
║   Version: 2.0 (Production-Ready)                  ║
║   Port: ${PORT}                                    ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(20)}   ║
╚════════════════════════════════════════════════════╝

Configuration Status:
  📝 GITHUB_TOKEN: ${process.env.GITHUB_TOKEN ? '✓ Configured' : '✗ NOT SET'}
  🔑 AI_API_KEY: ${process.env.AI_API_KEY ? '✓ Configured' : '✗ NOT SET'}
  🌐 FRONTEND_URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}
  🚨 Rate Limit: 10 requests per 15 minutes per IP

Security Features:
  ✅ API keys stored server-side (.env.local only)
  ✅ Frontend → Backend API (no direct external calls)
  ✅ CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}
  ✅ Request size limits: 1MB max
  ✅ Request timeouts: 10s (external APIs)
  ✅ Rate limiting: ${process.env.NODE_ENV === 'development' ? 'DISABLED (dev mode)' : 'ENABLED'}
  ✅ Request ID tracing: Enabled
  ✅ Structured error responses: Enabled

Available Endpoints:
  POST   /api/roast       - Generate roast for GitHub user
  GET    /api/health      - Health check
  GET    /api/proxy-image - Proxy GitHub images

Documentation:
  • Each request gets a unique X-Request-ID header for tracing
  • Rate limit headers returned in RateLimit-* response headers
  • All timestamps in ISO 8601 format

Debug Mode: ${process.env.NODE_ENV === 'development' ? 'ON (detailed error messages)' : 'OFF'}
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});