/**
 * API Request and Response Schemas
 * Validates data sent to and received from the backend
 */

import { z } from "zod";

/**
 * Roast API Request Schema
 * Validates the request payload for /api/roast endpoint
 */
export const RoastRequestSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .max(39, "Username must be 39 characters or less")
    .regex(
      /^[a-zA-Z0-9-_]+$/,
      "Username can only contain letters, numbers, hyphens, and underscores",
    ),
});

export type RoastRequest = z.infer<typeof RoastRequestSchema>;

/**
 * Roast API Success Response Schema
 * Validates successful response from /api/roast endpoint
 */
export const RoastResponseSchema = z.object({
  username: z.string(),
  score: z.number().int().min(0).max(100),
  roasts: z.array(z.string()).min(0),
  category: z.string().optional(),
});

export type RoastResponse = z.infer<typeof RoastResponseSchema>;

/**
 * API Error Response Schema
 * Validates error responses from the backend
 */
export const ApiErrorSchema = z.object({
  error: z.object({
    type: z.string(),
    message: z.string(),
    details: z.string().optional(),
  }),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

/**
 * Generic API Response Schema (union of success and error)
 * Discriminates between success and error responses
 */
export const ApiResponseSchema = z.discriminatedUnion("error", [
  z.object({
    error: z.undefined(),
    username: z.string(),
    score: z.number(),
    roasts: z.array(z.string()),
  }),
  z.object({
    error: z.object({
      type: z.string(),
      message: z.string(),
      details: z.string().optional(),
    }),
  }),
]);

export type ApiResponse = z.infer<typeof ApiResponseSchema>;

/**
 * Validates and parses a roast API response
 * Throws ZodError if validation fails
 */
export function validateRoastResponse(data: unknown): RoastResponse {
  return RoastResponseSchema.parse(data);
}

/**
 * Checks if response is an error response
 */
export function isApiError(data: unknown): data is ApiError {
  return ApiErrorSchema.safeParse(data).success;
}

/**
 * Safely validates roast response with fallback
 * Returns parsed data or null if validation fails
 */
export function safeValidateRoastResponse(data: unknown): RoastResponse | null {
  const result = RoastResponseSchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Safely validates API error response
 */
export function safeValidateApiError(data: unknown): ApiError | null {
  const result = ApiErrorSchema.safeParse(data);
  return result.success ? result.data : null;
}
