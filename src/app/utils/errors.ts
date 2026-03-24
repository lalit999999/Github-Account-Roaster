export enum ErrorType {
  EMPTY_USERNAME = "EMPTY_USERNAME",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  NETWORK_ERROR = "NETWORK_ERROR",
  AI_API_ERROR = "AI_API_ERROR",
  INVALID_USERNAME = "INVALID_USERNAME",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export interface AppError {
  type: ErrorType;
  message: string;
  details?: string;
}

export const ERROR_MESSAGES: Record<
  ErrorType,
  { title: string; description: string }
> = {
  [ErrorType.EMPTY_USERNAME]: {
    title: "Username Required",
    description: "Please enter a GitHub username to get roasted!",
  },
  [ErrorType.USER_NOT_FOUND]: {
    title: "User Not Found",
    description:
      "This GitHub user doesn't exist. Check the spelling and try again!",
  },
  [ErrorType.RATE_LIMIT_EXCEEDED]: {
    title: "Rate Limit Exceeded",
    description:
      "GitHub API rate limit exceeded. Please wait a few minutes and try again.",
  },
  [ErrorType.NETWORK_ERROR]: {
    title: "Network Error",
    description:
      "Unable to connect to GitHub. Please check your internet connection.",
  },
  [ErrorType.AI_API_ERROR]: {
    title: "Roast Generation Failed",
    description: "Failed to generate roast. Please try again later.",
  },
  [ErrorType.INVALID_USERNAME]: {
    title: "Invalid Username",
    description:
      "GitHub username can only contain alphanumeric characters, hyphens, and underscores.",
  },
  [ErrorType.UNKNOWN_ERROR]: {
    title: "Oops! Something went wrong",
    description: "An unexpected error occurred. Please try again.",
  },
};

export class GitHubRoastError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public details?: string,
  ) {
    super(message);
    this.name = "GitHubRoastError";
  }
}

export function detectErrorType(error: any): AppError {
  const message = error?.message?.toLowerCase() || "";
  const details = error?.message || "";

  // Check for specific error patterns
  if (
    message.includes("not found") ||
    message.includes("404") ||
    error?.status === 404
  ) {
    return {
      type: ErrorType.USER_NOT_FOUND,
      message: "GitHub user not found",
      details,
    };
  }

  if (
    message.includes("rate limit") ||
    message.includes("429") ||
    error?.status === 403
  ) {
    return {
      type: ErrorType.RATE_LIMIT_EXCEEDED,
      message: "Rate limit exceeded",
      details,
    };
  }

  if (message.includes("network") || message.includes("fetch")) {
    return {
      type: ErrorType.NETWORK_ERROR,
      message: "Network error occurred",
      details,
    };
  }

  if (message.includes("ai") || message.includes("api")) {
    return {
      type: ErrorType.AI_API_ERROR,
      message: "AI API error",
      details,
    };
  }

  return {
    type: ErrorType.UNKNOWN_ERROR,
    message: "An unknown error occurred",
    details,
  };
}
