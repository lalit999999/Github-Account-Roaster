/**
 * Shared Error Type Definitions
 * Defines all error types that the backend can return
 * Used by both frontend and backend for consistent error handling
 */

/**
 * Backend error types - must match what server returns in error.type
 */
export const BACKEND_ERROR_TYPES = {
  INVALID_INPUT: "INVALID_INPUT",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  GITHUB_API_ERROR: "GITHUB_API_ERROR",
  AI_API_ERROR: "AI_API_ERROR",
  AI_RATE_LIMIT: "AI_RATE_LIMIT",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  NOT_FOUND: "NOT_FOUND", // 404 responses
} as const;

/**
 * Type guard to check if a string is a valid backend error type
 */
export function isBackendErrorType(
  value: unknown,
): value is keyof typeof BACKEND_ERROR_TYPES {
  return typeof value === "string" && value in BACKEND_ERROR_TYPES;
}

/**
 * Get all valid backend error types
 */
export function getBackendErrorTypes(): string[] {
  return Object.values(BACKEND_ERROR_TYPES);
}
