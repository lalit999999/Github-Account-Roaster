/**
 * Shared Error Type Definitions (Backend Reference)
 * 
 * This file documents the error types that the backend returns.
 * The frontend has a TypeScript version at src/app/utils/sharedErrors.ts
 * that maps these to frontend error types.
 * 
 * When adding a new error type to the backend, update both:
 * 1. This file (backend reference)
 * 2. server/utils/sharedErrors.ts if it exists
 * 3. src/app/utils/sharedErrors.ts (frontend mapping)
 * 4. src/app/utils/errorMapping.ts (add mapping entry)
 */

/**
 * All possible backend error types that can be returned in error.type
 */
const BACKEND_ERROR_TYPES = {
    // Input validation errors
    INVALID_INPUT: "INVALID_INPUT", // Invalid or missing username

    // GitHub API errors
    USER_NOT_FOUND: "USER_NOT_FOUND", // GitHub user doesn't exist
    GITHUB_API_ERROR: "GITHUB_API_ERROR", // Generic GitHub API failure

    // Rate limiting errors (both GitHub and AI APIs)
    RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED", // GitHub rate limit
    AI_RATE_LIMIT: "AI_RATE_LIMIT", // Anthropic API rate limit

    // AI API errors
    AI_API_ERROR: "AI_API_ERROR", // Generic AI API failure

    // Server errors
    INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR", // Server error (5xx)
    NOT_FOUND: "NOT_FOUND", // Endpoint not found (404)

    // Generic fallback
    UNKNOWN_ERROR: "UNKNOWN_ERROR", // Uncategorized error
};

/**
 * How each backend error type maps to frontend ErrorType enum
 * 
 * Backend ErrorType → Frontend ErrorType
 */
const ERROR_MAPPING = {
    INVALID_INPUT: "INVALID_USERNAME",
    USER_NOT_FOUND: "USER_NOT_FOUND",
    NOT_FOUND: "USER_NOT_FOUND",
    RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
    GITHUB_API_ERROR: "UNKNOWN_ERROR",
    AI_API_ERROR: "AI_API_ERROR",
    AI_RATE_LIMIT: "RATE_LIMIT_EXCEEDED", // Rate limiting applies to both APIs
    INTERNAL_SERVER_ERROR: "UNKNOWN_ERROR",
    UNKNOWN_ERROR: "UNKNOWN_ERROR",
};

/**
 * Example error responses from backend
 */
const ERROR_RESPONSE_EXAMPLES = {
    // When user provides invalid input
    INVALID_INPUT_EXAMPLE: {
        error: {
            type: "INVALID_INPUT",
            message: "Username is required and must be a string",
        },
        status: 400,
    },

    // When GitHub user doesn't exist
    USER_NOT_FOUND_EXAMPLE: {
        error: {
            type: "USER_NOT_FOUND",
            message: "GitHub user not found",
            details: "The specified GitHub user could not be found",
        },
        status: 404,
    },

    // When rate limit is exceeded
    RATE_LIMIT_EXAMPLE: {
        error: {
            type: "RATE_LIMIT_EXCEEDED",
            message: "Rate limit exceeded",
            details: "GitHub API rate limit exceeded. Please try again later.",
        },
        status: 429,
    },

    // When AI API fails
    AI_API_ERROR_EXAMPLE: {
        error: {
            type: "AI_API_ERROR",
            message: "Failed to generate roast",
            details: "The AI service is temporarily unavailable",
        },
        status: 500,
    },
};

module.exports = {
    BACKEND_ERROR_TYPES,
    ERROR_MAPPING,
    ERROR_RESPONSE_EXAMPLES,
};
