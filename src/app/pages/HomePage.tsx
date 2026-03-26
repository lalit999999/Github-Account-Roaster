import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { UsernameInput } from "../components/UsernameInput";
import { ErrorDisplay } from "../components/ErrorDisplay";
import { Sparkles } from "lucide-react";
import { useState } from "react";

export function HomePage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleRoast = (username: string) => {
    // Navigate to the roast page with username
    navigate(`/${username}`);
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
      <div className="relative z-10 container mx-auto px-4 py-12 md:py-20 flex flex-col items-center min-h-screen justify-center">
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
                errorType={error as any}
                onDismiss={() => setError(null)}
                onRetry={() => setError(null)}
                canRetry={false}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Input section */}
        <UsernameInput onRoast={handleRoast} isLoading={false} />

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
