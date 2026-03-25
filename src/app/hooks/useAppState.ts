/**
 * App State Management using useReducer
 * Provides cohesive state management for roast loading, data, and errors
 */

import { ErrorType } from "../utils/errors";
import type { RoastData } from "../components/RoastCard";
import { LOADING_MESSAGES } from "../config";

/**
 * Application state shape
 */
export interface AppState {
  isLoading: boolean;
  loadingMessage: string;
  roastData: RoastData | null;
  error: ErrorType | null;
  failedUsername: string | null; // Store failed username for retry
}

/**
 * Action types for state management
 */
export type AppAction =
  | { type: "RESET" }
  | { type: "START_LOADING"; payload?: string } // Optional username for retry
  | { type: "SET_ERROR"; payload: ErrorType }
  | { type: "SET_SUCCESS"; payload: RoastData }
  | { type: "LOADING_COMPLETE" };

/**
 * Initial state
 */
export const INITIAL_APP_STATE: AppState = {
  isLoading: false,
  loadingMessage: "",
  roastData: null,
  error: null,
  failedUsername: null,
};

/**
 * Select a random loading message for the request
 */
function getRandomLoadingMessage(): string {
  return LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
}

/**
 * App state reducer
 * Manages state transitions for loading, success, and error states
 */
export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "RESET":
      return INITIAL_APP_STATE;

    case "START_LOADING":
      return {
        isLoading: true,
        loadingMessage: getRandomLoadingMessage(),
        roastData: null,
        error: null,
        failedUsername: action.payload || null, // Store username for retry
      };

    case "SET_ERROR":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        // Keep failedUsername so user can retry
      };

    case "SET_SUCCESS":
      return {
        isLoading: false,
        loadingMessage: "",
        roastData: action.payload,
        error: null,
        failedUsername: null, // Clear failed username on success
      };

    case "LOADING_COMPLETE":
      return {
        ...state,
        isLoading: false,
      };

    default:
      return state;
  }
}
