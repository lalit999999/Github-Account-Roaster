/**
 * Simple logger utility for consistent logging across the app
 */

export const logger = {
    info: (requestId, module, message) => {
        console.log(`[${requestId}] [${module}] ${message}`);
    },
    warn: (requestId, module, message) => {
        console.warn(`[${requestId}] [${module}] ${message}`);
    },
    error: (requestId, module, message, error = null) => {
        console.error(`[${requestId}] [${module}] ${message}`, error || '');
    },
};
