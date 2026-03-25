import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UsernameInput } from "./components/UsernameInput";
import { LoadingSkeleton } from "./components/LoadingSkeleton";
import { RoastCard, RoastData } from "./components/RoastCard";
import { ErrorDisplay } from "./components/ErrorDisplay";
import { ShareButtons } from "./components/ShareButtons";
import { Sparkles } from "lucide-react";
import { ErrorType, ERROR_MESSAGES } from "./utils/errors";

// Mock roast data generator
const generateMockRoast = (username: string): RoastData => {
  const roastTemplates = [
    [
      "You start projects faster than you finish them.",
      "Your README files appear to be optional.",
      "Half your repos haven't been touched in years.",
      "Your commit messages read like a cryptic diary.",
      "You fork more than you contribute.",
    ],
    [
      '90% of your repos are "test" or "playground".',
      "Your documentation is shorter than your coffee breaks.",
      "You have more abandoned projects than completed ones.",
      'Your latest commit was probably "fix typo".',
      "Your code comments are more confusing than the code itself.",
    ],
    [
      "You copied that from Stack Overflow, didn't you?",
      "Your repositories are a graveyard of good intentions.",
      "You have 47 unfinished side projects and counting.",
      "Your branches are never merged, only abandoned.",
      "You code like you're allergic to consistency.",
    ],
  ];

  const categories = [
    "Weekend Hacker",
    "Serial Starter",
    "Copy-Paste Warrior",
    "Commit Message Poet",
    "TODO List Champion",
    "Perfectionist Procrastinator",
  ];

  const randomRoasts =
    roastTemplates[Math.floor(Math.random() * roastTemplates.length)];
  const selectedRoasts = randomRoasts.slice(
    0,
    3 + Math.floor(Math.random() * 2),
  );

  return {
    username,
    avatar: `https://github.com/${username}.png`,
    score: 60 + Math.floor(Math.random() * 35),
    category: categories[Math.floor(Math.random() * categories.length)],
    roasts: selectedRoasts,
  };
};

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [roastData, setRoastData] = useState<RoastData | null>(null);
  const [error, setError] = useState<ErrorType | null>(null);

  const handleRoast = async (username: string) => {
    setIsLoading(true);
    setRoastData(null);
    setError(null);

    try {
      // Client-side validation
      if (!username || username.trim().length === 0) {
        setError(ErrorType.EMPTY_USERNAME);
        setIsLoading(false);
        return;
      }

      if (!/^[a-zA-Z0-9-_]+$/.test(username)) {
        setError(ErrorType.INVALID_USERNAME);
        setIsLoading(false);
        return;
      }

      // ✅ SECURE: Call backend API (not external APIs directly)
      // API keys stay on the server - frontend never sees them
      const API_URL =
        (import.meta as any).env.VITE_API_URL || "http://localhost:4001";

      const res = await fetch(`${API_URL}/api/roast`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();

      // Handle error responses from backend
      if (data.error) {
        // Map backend error types to frontend error types
        let errorType = data.error.type as ErrorType;

        // Map unknown backend error types to frontend types
        const errorTypeMapping: Record<string, ErrorType> = {
          INVALID_INPUT: ErrorType.INVALID_USERNAME,
          NOT_FOUND: ErrorType.UNKNOWN_ERROR,
          INTERNAL_SERVER_ERROR: ErrorType.UNKNOWN_ERROR,
        };

        if (errorTypeMapping[errorType]) {
          errorType = errorTypeMapping[errorType];
        } else if (!Object.values(ErrorType).includes(errorType)) {
          errorType = ErrorType.UNKNOWN_ERROR;
        }

        setError(errorType);
        setIsLoading(false);
        return;
      }

      // API call failed
      if (!res.ok) {
        setError(ErrorType.UNKNOWN_ERROR);
        setIsLoading(false);
        return;
      }

      // Success: Transform API response to match RoastData format
      setRoastData({
        username: data.username,
        avatar: `https://github.com/${data.username}.png`,
        score: data.score,
        roasts: data.roasts,
        category: data.roasts.length > 0 ? "GitHub Developer" : "Unknown",
      });
    } catch (error: any) {
      console.error("Error:", error);
      // Network or other errors
      if (error.message?.includes("fetch")) {
        setError(ErrorType.NETWORK_ERROR);
      } else {
        setError(ErrorType.UNKNOWN_ERROR);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setRoastData(null);
    setIsLoading(false);
    setError(null);
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
      <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">
        {/* Hero section */}
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
            Let AI roast your coding habits.
          </motion.p>
        </motion.div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <div className="mb-8">
              <ErrorDisplay
                errorType={error}
                onDismiss={() => setError(null)}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Input section */}
        {!roastData && !isLoading && (
          <UsernameInput onRoast={handleRoast} isLoading={isLoading} />
        )}

        {/* Loading state */}
        {isLoading && <LoadingSkeleton />}

        {/* Roast result */}
        {roastData && (
          <>
            <RoastCard data={roastData} />
            <ShareButtons username={roastData.username} />

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
          className="text-center mt-20 text-gray-500 text-sm"
        >
          <p>Built with ❤️ for developers who can take a joke</p>
        </motion.div>
      </div>
    </div>
  );
}
