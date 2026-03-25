import { randomUUID } from 'crypto';

/**
 * Request ID Middleware
 * Generates a unique ID for each request for tracing and logging
 */
export function requestIdMiddleware(req, res, next) {
    req.id = randomUUID();
    res.setHeader('X-Request-ID', req.id);
    console.log(`[${req.id}] ${req.method} ${req.path}`);
    next();
}
