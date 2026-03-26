import express from 'express';
import fetch from 'node-fetch';
import { generateGitHubRoast } from '../api.js';
import { roastLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * POST /api/roast
 * Generate a funny roast for a GitHub user
 * 
 * Request: { username: string }
 * Response: { username: string, score: number, roasts: string[] }
 */
router.post('/roast', roastLimiter, async (req, res) => {
    try {
        const { username } = req.body;

        // Validate input
        if (!username || typeof username !== 'string') {
            return res.status(400).json({
                error: {
                    type: 'INVALID_INPUT',
                    message: 'Username is required and must be a string',
                },
            });
        }

        // Generate roast using secure backend APIs
        console.log(`[${req.id}] [POST /api/roast] Calling generateGitHubRoast...`);
        const result = await generateGitHubRoast(username);
        const statusCode = result.status || 500;

        // If there was an error, return it with appropriate status
        if (result.error) {
            console.warn(`[${req.id}] [POST /api/roast] Error response:`, result.error);
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
router.get('/health', (req, res) => {
    console.log(`[${req.id}] [GET /api/health] Health check`);
    res.status(200).json({
        timestamp: new Date().toISOString(),
        requestId: req.id,
    });
});

/**
 * GET /api/proxy-image
 * Proxy external images to bypass CORS restrictions
 * 
 * Query: { url: string }
 * Response: { dataUrl: string }
 */
router.get('/proxy-image', async (req, res) => {
    try {
        const { url } = req.query;

        if (!url || typeof url !== 'string') {
            console.warn(`[${req.id}] [GET /api/proxy-image] Invalid URL provided`);
            return res.status(400).json({
                error: {
                    type: 'INVALID_INPUT',
                    message: 'URL is required and must be a string',
                },
            });
        }

        // Validate URL to prevent SSRF attacks (only allow GitHub URLs)
        const urlObj = new URL(url);
        if (!urlObj.hostname.includes('github.com') && !urlObj.hostname.includes('githubusercontent.com')) {
            console.warn(`[${req.id}] [GET /api/proxy-image] Unauthorized domain: ${urlObj.hostname}`);
            return res.status(403).json({
                error: {
                    type: 'FORBIDDEN',
                    message: 'Only GitHub and GitHub user content URLs are allowed',
                },
            });
        }

        console.log(`[${req.id}] [GET /api/proxy-image] Proxying image from: ${url}`);

        // Fetch the image from GitHub
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'GitHub-Roast-Tool/1.0',
            },
        });

        if (!response.ok) {
            console.warn(`[${req.id}] [GET /api/proxy-image] Failed to fetch image (status: ${response.status})`);
            return res.status(response.status).json({
                error: {
                    type: 'IMAGE_FETCH_FAILED',
                    message: `Failed to fetch image: ${response.statusText}`,
                },
            });
        }

        // Get the image buffer and convert to base64
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const contentType = response.headers.get('content-type') || 'image/png';
        const dataUrl = `data:${contentType};base64,${base64}`;

        console.log(`[${req.id}] [GET /api/proxy-image] Successfully proxied image (size: ${buffer.byteLength} bytes)`);

        return res.status(200).json({
            dataUrl,
        });
    } catch (error) {
        console.error(`[${req.id}] [GET /api/proxy-image] Error:`, error);
        return res.status(500).json({
            error: {
                type: 'PROXY_ERROR',
                message: 'Failed to proxy image',
            },
        });
    }
});

export default router;
