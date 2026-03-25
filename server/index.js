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
    ]
    ,
    credentials: true,
}));

app.use(helmet());

// Body size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// Request ID middleware - for tracing
app.use(requestIdMiddleware);

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
 / Mount API routes
app.use('/api', roastRoutes
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