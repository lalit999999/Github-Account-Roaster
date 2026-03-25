import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateGitHubRoast } from './api.js';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});


app.post('/api/roast', async (req, res) => {
    try {
        const { username } = req.body;
        console.log(`[POST /api/roast] Received request for username: ${username}`);

        // Validate input
        if (!username || typeof username !== 'string') {
            console.warn(`[POST /api/roast] Invalid input - missing or invalid username`);
            return res.status(400).json({
                error: {
                    type: 'EMPTY_USERNAME',
                    message: 'Username is required',
                },
            });
        }

        // Generate roast using secure backend APIs
        console.log(`[POST /api/roast] Calling generateGitHubRoast function...`);
        const result = await generateGitHubRoast(username.trim());

        // If there was an error, return it with appropriate status
        if (result.error) {
            console.warn(`[POST /api/roast] Error response:`, result.error);
            return res.status(result.status || 500).json(result);
        }

        // Success response
        console.log(`[POST /api/roast] Success - returning roast result`);
        return res.status(200).json(result);
    } catch (error) {
        console.error('[POST /api/roast] Unexpected error:', error);
        return res.status(500).json({
            error: {
                type: 'UNKNOWN_ERROR',
                message: 'An unexpected error occurred',
            },
        });
    }
});

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});


app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        path: req.path,
    });
});


app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
  ╔════════════════════════════════════════╗
  ║   GitHub Roast API Server              ║
  ║   Server running on port ${PORT}            ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}         ║
  ╚════════════════════════════════════════╝
  
  Configuration:
  📝 GITHUB_TOKEN: ${process.env.GITHUB_TOKEN ? 'Configured ✓' : 'NOT CONFIGURED ✗'}
  🔑 AI_API_KEY: ${process.env.AI_API_KEY ? 'Configured ✓' : 'NOT CONFIGURED ✗'}
  🌐 FRONTEND_URL: ${process.env.FRONTEND_URL}
  
  Security Notes:
  ✅ API keys stored in .env.local (server-side only)
  ✅ Frontend → Backend API (never direct GitHub/AI calls)
  ✅ CORS enabled for ${process.env.FRONTEND_URL || 'http://localhost:5173'}
  
  Available endpoints:
  POST   /api/roast       - Generate roast for GitHub user
  GET    /api/health      - Health check
  
  Debug logging enabled - Check console for detailed request/response logs.
  `);
});
