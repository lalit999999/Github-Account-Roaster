/**
 * API Client utility with built-in schema validation
 * Provides type-safe API calls with automatic response validation
 */

import {
  validateRoastResponse,
  safeValidateApiError,
  type RoastResponse,
} from "./schemas";
import { buildApiUrl, API_ENDPOINTS } from "../config";

interface ApiCallOptions {
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * Calls the roast API endpoint with schema validation
 * @throws Error with validation details if response validation fails
 */
export async function callRoastApi(
  username: string,
  options: ApiCallOptions = {},
): Promise<{
  success: boolean;
  data?: RoastResponse;
  error?: { type: string; message: string; details?: string };
}> {
  try {
    const res = await fetch(buildApiUrl(API_ENDPOINTS.roast), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify({ username }),
      signal: options.timeout
        ? AbortSignal.timeout(options.timeout)
        : undefined,
    });

    const data = await res.json();

    // Check for error response
    const errorResponse = safeValidateApiError(data);
    if (errorResponse) {
      return {
        success: false,
        error: errorResponse.error,
      };
    }

    // Validate status code
    if (!res.ok) {
      return {
        success: false,
        error: {
          type: "HTTP_ERROR",
          message: `HTTP ${res.status}: ${res.statusText}`,
        },
      };
    }

    // Validate and parse response
    const roastData = validateRoastResponse(data);
    return {
      success: true,
      data: roastData,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: {
        type: "REQUEST_ERROR",
        message,
        details: String(error),
      },
    };
  }
}

/**
 * Type guard to check if API response is successful
 */
export function isSuccessResponse<T>(response: {
  success: boolean;
  data?: T;
  error?: unknown;
}): response is { success: true; data: T } {
  return response.success && response.data !== undefined;
}

/**
 * Type guard to check if API response is an error
 */
export function isErrorResponse(response: {
  success: boolean;
  error?: unknown;
}): response is { success: false; error: unknown } {
  return !response.success && response.error !== undefined;
}
