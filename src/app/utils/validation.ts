/**
 * GitHub username validation utilities
 * Shared validation logic used across components and API calls
 */

// Constants
export const USERNAME_MIN_LENGTH = 1;
export const USERNAME_MAX_LENGTH = 39;
export const USERNAME_REGEX = /^[a-zA-Z0-9-_]+$/;

/**
 * Validates username format and returns a user-friendly error message
 * Used for form validation and real-time feedback
 */
export function validateUsername(value: string): string {
  // Empty input - return empty string (no error message for empty)
  if (!value.trim()) {
    return "";
  }

  if (value.length < USERNAME_MIN_LENGTH) {
    return "Username is required";
  }

  if (value.length > USERNAME_MAX_LENGTH) {
    return `GitHub username must be ${USERNAME_MAX_LENGTH} characters or less`;
  }

  if (!USERNAME_REGEX.test(value)) {
    return "Username can only contain letters, numbers, hyphens, and underscores";
  }

  return "";
}

/**
 * Validates if username is not empty
 * Returns true if username is valid for submission
 */
export function isUsernameNotEmpty(username: string): boolean {
  return !!username && username.trim().length > 0;
}

/**
 * Validates username format only (regex check)
 * Returns true if username matches valid format
 */
export function isUsernameFormatValid(username: string): boolean {
  return USERNAME_REGEX.test(username);
}

/**
 * Combined validation: checks both empty and format
 * Returns true if username passes all checks
 */
export function isUsernameValid(username: string): boolean {
  return (
    isUsernameNotEmpty(username) &&
    isUsernameFormatValid(username) &&
    username.length <= USERNAME_MAX_LENGTH
  );
}
