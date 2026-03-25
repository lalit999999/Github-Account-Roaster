/**
 * Application configuration constants
 * Centralized configuration with proper type safety
 */

// ==================== API Configuration ====================
const DEFAULT_API_PORT = 4001;
const DEFAULT_API_HOST = "localhost";
const API_BASE_PATH = "/api";

/**
 * Get the API base URL from environment or use default
 * Properly typed with fallback to localhost for development
 */
export function getApiUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;

  if (envUrl) {
    return envUrl.replace(/\/$/, ""); // Remove trailing slash if present
  }

  // Development fallback
  return `http://${DEFAULT_API_HOST}:${DEFAULT_API_PORT}`;
}

/**
 * API endpoints - use these instead of hardcoding paths
 */
export const API_ENDPOINTS = {
  roast: `${API_BASE_PATH}/roast`,
} as const;

/**
 * Build full API endpoint URL
 */
export function buildApiUrl(endpoint: string): string {
  return `${getApiUrl()}${endpoint}`;
}

/**
 * Timeout for fetch requests (in milliseconds)
 * Set to 30 seconds to allow time for GitHub API and AI API calls
 */
export const FETCH_TIMEOUT = 30000; // 30 seconds

// ==================== GitHub Configuration ====================

/**
 * GitHub avatar URL pattern
 */
export function getGitHubAvatarUrl(username: string): string {
  return `https://github.com/${username}.png`;
}

/**
 * GitHub username validation constants
 * Must match backend validation
 */
export const USERNAME_CONSTRAINTS = {
  minLength: 1,
  maxLength: 39,
  // Pattern: alphanumeric, hyphens, underscores
  pattern: /^[a-zA-Z0-9-_]+$/,
} as const;

// ==================== UI Configuration ====================

/**
 * Default loading messages for better UX
 */
export const LOADING_MESSAGES = [
  "Analyzing repositories...",
  "Finding abandoned projects...",
  "Generating roast...",
  "Reading your commit history...",
  "Calculating shame points...",
] as const;

/**
 * Avatar fallback initials count (characters to show)
 */
export const AVATAR_INITIALS_LENGTH = 2;

/**
 * Animation timings
 */
export const ANIMATION_TIMINGS = {
  fast: 0.3,
  normal: 0.5,
  slow: 0.8,
} as const;
