import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import rateLimit from 'express-rate-limit';
import { generateGitHubRoast } from './api.js';

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
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));

// Body size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// Request ID middleware - for tracing
app.use((req, res, next) => {
    req.id = randomUUID();
    res.setHeader('X-Request-ID', req.id);
    console.log(`[${req.id}] ${req.method} ${req.path}`);
    next();
});

// Rate limiter for /api/roast endpoint
// 10 requests per 15 minutes per IP address
const roastLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: {
        error: {
            type: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many roast requests. Please try again in 15 minutes.',
        },
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: (req) => process.env.NODE_ENV === 'development', // Skip rate limiting in development
    handler: (req, res) => {
        console.warn(
            `[${req.id}] Rate limit exceeded for IP: ${req.ip}`
        );
        res.status(429).json({
            error: {
                type: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests. Please try again later.',
            },
        });
    },
});

// ==================== ROUTES ====================

/**
 * POST /api/roast
 * Generate a funny roast for a GitHub user
 * 
 * Request: { username: string }
 * Response: { username: string, score: number, roasts: string[] }
 */
app.post('/api/roast', roastLimiter, async (req, res) => {
    try {
        const { username } = req.body;
        console.log(`[${req.id}] [POST /api/roast] Received request for username: ${username}`);

        // Validate input
        if (!username || typeof username !== 'string') {
            console.warn(`[${req.id}] [POST /api/roast] Invalid input - missing or invalid username`);
            return res.status(400).json({
                error: {
                    type: 'INVALID_INPUT',
                    message: 'Username is required and must be a string',
                },
            });
        }

        // Generate roast using secure backend APIs
        console.log(`[${req.id}] [POST /api/roast] Calling generateGitHubRoast...`);
        const result = await generateGitHubRoast(username.trim(), req.id);

        // If there was an error, return it with appropriate status
        if (result.error) {
            console.warn(`[${req.id}] [POST /api/roast] Error response:`, result.error);
            const statusCode = result.status || 500;
            return res.status(statusCode).json({
                error: result.error,
            });
        }

        // Success response
        console.log(`[${req.id}] [POST /api/roast] Success - returning roast result`);
        return res.status(200).json(result);
    } catch (error) {
        console.error(`[${req.id}] [POST /api/roast] Unexpected error:`, error);
        return res.status(500).json({
            error: {
                type: 'UNKNOWN_ERROR',
                message: 'An unexpected error occurred. Please try again later.',
            },
        });
    }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    console.log(`[${req.id}] [GET /api/health] Health check`);
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        requestId: req.id,
    });
});

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
║   Port: ${PORT}                                           ║
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