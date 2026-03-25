import rateLimit from 'express-rate-limit';

/**
 * Rate Limiter for /api/roast endpoint
 * 25 requests per 15 minutes per IP address
 * 
 * Disable rate limiting by setting DISABLE_RATE_LIMIT=true in environment
 */
export const roastLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 25, // Limit each IP to 25 requests per windowMs
    message: {
        error: {
            type: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many roast requests. Please try again in 15 minutes.',
        },
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: (req) => {
        const isDisabled = process.env.DISABLE_RATE_LIMIT === 'true';
        const isDevelopment = process.env.NODE_ENV === 'development';
        if (isDisabled || isDevelopment) {
            console.log(`[${req.id}] Rate limiting skipped (DISABLE_RATE_LIMIT=${isDisabled}, NODE_ENV=${process.env.NODE_ENV})`);
            return true;
        }
        return false;
    },
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
