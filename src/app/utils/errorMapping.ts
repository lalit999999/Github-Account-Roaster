/**
 * Error Type Mapping
 * Maps backend error types to frontend ErrorType enum
 * Centralized mapping to prevent fragile string matching
 */

import { ErrorType } from "./errors";
import { BACKEND_ERROR_TYPES, isBackendErrorType } from "./sharedErrors";

/**
 * Comprehensive mapping from backend error types to frontend ErrorType
 * Each backend error type must have a corresponding frontend type
 */
export const BACKEND_TO_FRONTEND_ERROR_MAP: Record<
  keyof typeof BACKEND_ERROR_TYPES,
  ErrorType
> = {
  INVALID_INPUT: ErrorType.INVALID_USERNAME,
  USER_NOT_FOUND: ErrorType.USER_NOT_FOUND,
  NOT_FOUND: ErrorType.USER_NOT_FOUND,
  RATE_LIMIT_EXCEEDED: ErrorType.RATE_LIMIT_EXCEEDED,
  GITHUB_API_ERROR: ErrorType.UNKNOWN_ERROR,
  AI_API_ERROR: ErrorType.AI_API_ERROR,
  AI_RATE_LIMIT: ErrorType.RATE_LIMIT_EXCEEDED, // Rate limiting applies to both APIs
  INTERNAL_SERVER_ERROR: ErrorType.UNKNOWN_ERROR,
  UNKNOWN_ERROR: ErrorType.UNKNOWN_ERROR,
};

/**
 * Maps a backend error type string to a frontend ErrorType
 * Uses type-safe mapping with fallback to UNKNOWN_ERROR
 */
export function mapBackendErrorToFrontend(backendErrorType: string): ErrorType {
  // Check if it's a known backend error type
  if (isBackendErrorType(backendErrorType)) {
    return BACKEND_TO_FRONTEND_ERROR_MAP[backendErrorType];
  }

  // Log unknown backend error type for debugging
  console.warn(
    `Unknown backend error type received: "${backendErrorType}". Mapping to UNKNOWN_ERROR.`,
  );

  // Fallback to UNKNOWN_ERROR for unmapped types
  return ErrorType.UNKNOWN_ERROR;
}

/**
 * Validates and maps a backend error response
 * Ensures type safety and provides clear error handling
 */
export function processBackendError(backendErrorType: unknown): ErrorType {
  if (typeof backendErrorType !== "string") {
    console.warn(
      `Invalid backend error type (not a string):`,
      backendErrorType,
    );
    return ErrorType.UNKNOWN_ERROR;
  }

  return mapBackendErrorToFrontend(backendErrorType);
}
