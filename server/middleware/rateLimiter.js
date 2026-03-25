import rateLimit from 'express-rate-limit';

/**
 * Rate Limiter for /api/roast endpoint
 * 10 requests per 15 minutes per IP address
 */
export const roastLimiter = rateLimit({
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
        console.warn(`[${req.id}] Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: {
                type: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests. Please try again later.',
            },
        });
    },
});
