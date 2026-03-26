import { useParams, useNavigate } from "react-router-dom";
import { useReducer, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RoastCard, RoastData } from "../components/RoastCard";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { ErrorDisplay } from "../components/ErrorDisplay";
import { ShareButtons } from "../components/ShareButtons";
import { Sparkles } from "lucide-react";
import { ErrorType, ERROR_MESSAGES } from "../utils/errors";
import { isUsernameFormatValid, isUsernameNotEmpty } from "../utils/validation";
import {
  buildApiUrl,
  API_ENDPOINTS,
  getGitHubAvatarUrl,
  FETCH_TIMEOUT,
} from "../config";
import {
  validateRoastResponse,
  safeValidateApiError,
  type RoastResponse,
} from "../api/schemas";
import { processBackendError } from "../utils/errorMapping";
import {
  appReducer,
  INITIAL_APP_STATE,
  type AppState,
} from "../hooks/useAppState";

export function RoastPage() {
  const { username: usernameParam } = useParams();
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(appReducer, INITIAL_APP_STATE);

  // Auto-fetch roast data when component mounts or username changes
  useEffect(() => {
    if (!usernameParam) {
      dispatch({ type: "SET_ERROR", payload: ErrorType.INVALID_USERNAME });
      return;
    }

    handleRoast(usernameParam);
  }, [usernameParam]);

  const handleRoast = async (username: string) => {
    dispatch({ type: "START_LOADING", payload: username });

    // Create abort controller for request timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, FETCH_TIMEOUT);

    try {
      // Client-side validation
      if (!isUsernameNotEmpty(username)) {
        dispatch({ type: "SET_ERROR", payload: ErrorType.EMPTY_USERNAME });
        return;
      }

      if (!isUsernameFormatValid(username)) {
        dispatch({ type: "SET_ERROR", payload: ErrorType.INVALID_USERNAME });
        return;
      }

      // ✅ SECURE: Call backend API (not external APIs directly)
      // API keys stay on the server - frontend never sees them
      const res = await fetch(buildApiUrl(API_ENDPOINTS.roast), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
        signal: abortController.signal,
      });

      const data = await res.json();

      // Check for error response first
      const errorResponse = safeValidateApiError(data);
      if (errorResponse) {
        // Use centralized error mapping to convert backend error to frontend error
        const errorType = processBackendError(errorResponse.error.type);
        dispatch({ type: "SET_ERROR", payload: errorType });
        return;
      }

      // API call failed (non-200 status)
      if (!res.ok) {
        dispatch({ type: "SET_ERROR", payload: ErrorType.UNKNOWN_ERROR });
        return;
      }

      // Validate success response with schema
      let roastData: RoastResponse;
      try {
        roastData = validateRoastResponse(data);
      } catch (validationError) {
        console.error("Response validation failed:", validationError);
        dispatch({ type: "SET_ERROR", payload: ErrorType.UNKNOWN_ERROR });
        return;
      }

      // Success: Transform validated API response to match RoastData format
      dispatch({
        type: "SET_SUCCESS",
        payload: {
          username: roastData.username,
          avatar: getGitHubAvatarUrl(roastData.username),
          score: roastData.score,
          roasts: roastData.roasts,
          category:
            roastData.roasts.length > 0 ? "GitHub Developer" : "Unknown",
        },
      });
    } catch (error: any) {
      console.error("Error:", error);
      // Network or timeout errors
      if (error instanceof Error && error.name === "AbortError") {
        console.warn(
          "Request timeout - API took longer than",
          FETCH_TIMEOUT,
          "ms",
        );
        dispatch({ type: "SET_ERROR", payload: ErrorType.NETWORK_ERROR });
      } else if (error.message?.includes("fetch")) {
        dispatch({ type: "SET_ERROR", payload: ErrorType.NETWORK_ERROR });
      } else {
        dispatch({ type: "SET_ERROR", payload: ErrorType.UNKNOWN_ERROR });
      }
    } finally {
      clearTimeout(timeoutId);
      abortController.abort();
    }
  };

  const handleReset = () => {
    navigate("/");
  };

  const handleRetry = () => {
    if (state.failedUsername) {
      handleRoast(state.failedUsername);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10h80v80H10z' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: "100px 100px",
        }}
      />

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-12 md:py-20 flex flex-col items-center">
        {/* Hero section with Username */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="text-yellow-400" size={40} />
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              GitHub Roast Tool 🔥
            </h1>
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            >
              <Sparkles className="text-blue-400" size={40} />
            </motion.div>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto font-medium"
          >
            Roasting @{usernameParam}
          </motion.p>
        </motion.div>

        {/* Error message */}
        <AnimatePresence>
          {state.error && (
            <div className="mb-8">
              <ErrorDisplay
                errorType={state.error}
                onDismiss={() => handleReset()}
                onRetry={handleRetry}
                canRetry={!!state.failedUsername}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Loading state */}
        {state.isLoading && <LoadingSkeleton message={state.loadingMessage} />}

        {/* Roast result */}
        {state.roastData && (
          <>
            <RoastCard data={state.roastData} />
            <ShareButtons username={state.roastData.username} />

            {/* Try again button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="text-center mt-8"
            >
              <button
                onClick={handleReset}
                className="text-gray-400 hover:text-white underline transition-colors duration-300"
              >
                Try another username
              </button>
            </motion.div>
          </>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-20 text-gray-500 text-sm space-y-3"
        >
          <p>Built with ❤️ for developers who can take a joke</p>
          <div className="flex flex-col items-center gap-4 pt-4 border-t border-gray-700">
            <div className="text-gray-400">
              <p>
                Created by{" "}
                <a
                  href="https://www.lalitgurjar.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-blue-400 font-semibold transition-colors duration-300 underline"
                >
                  Lalit Gujar
                </a>
              </p>
            </div>
            <div className="flex gap-6 text-gray-400 text-xs">
              <a
                href="https://github.com/lalit999999"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors duration-300 flex items-center gap-1"
              >
                <span>GitHub</span>
              </a>
              <a
                href="https://linkedin.com/in/lalitgujar"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors duration-300 flex items-center gap-1"
              >
                <span>LinkedIn</span>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
