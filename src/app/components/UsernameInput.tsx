import { useState, useEffect } from "react";
import { Github, Flame, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { validateUsername } from "../utils/validation";
import { getGitHubAvatarUrl } from "../config";
import {
  usePreferredMotion,
  getAnimationDuration,
} from "../hooks/usePreferredMotion";

interface UsernameInputProps {
  onRoast: (username: string) => void;
  isLoading: boolean;
}

export function UsernameInput({ onRoast, isLoading }: UsernameInputProps) {
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [validationError, setValidationError] = useState("");
  const motionPreference = usePreferredMotion();
  const animationDuration = getAnimationDuration(motionPreference, 0.5, 0.01);

  useEffect(() => {
    if (username.trim().length > 0) {
      setAvatar(getGitHubAvatarUrl(username.trim()));
    } else {
      setAvatar("");
    }
  }, [username]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    setValidationError(validateUsername(value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateUsername(username);
    if (error) {
      setValidationError(error);
      return;
    }
    if (username.trim() && !isLoading) {
      onRoast(username.trim());
    }
  };

  const isValid = username.trim() && !validationError;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: animationDuration, delay: 0.2 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
              <Github size={24} aria-hidden="true" />
            </div>
            <label htmlFor="username-input" className="sr-only">
              GitHub Username
            </label>
            <input
              id="username-input"
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Enter GitHub username..."
              disabled={isLoading}
              aria-label="GitHub username"
              aria-invalid={!!validationError}
              aria-describedby={validationError ? "error-message" : undefined}
              className={`w-full pl-16 pr-6 py-5 bg-black/30 border-2 rounded-2xl text-white placeholder-gray-400 text-lg focus:outline-none focus:ring-4 transition-all duration-300 disabled:opacity-50 ${
                validationError
                  ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/30"
                  : "border-white/20 focus:border-purple-400 focus:ring-purple-500/30"
              }`}
            />
            {avatar && (
              <motion.img
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                src={avatar}
                alt="GitHub avatar"
                className="absolute right-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-2 border-white/30"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
          </div>

          {/* Validation error message */}
          {validationError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              id="error-message"
              role="alert"
              className="flex items-center gap-2 text-red-400 text-sm"
            >
              <AlertCircle size={16} aria-hidden="true" />
              <span>{validationError}</span>
            </motion.div>
          )}

          {/* Helper text */}
          {username && !validationError && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-300 text-sm"
            >
              ✓ Valid GitHub username
            </motion.p>
          )}

          <motion.button
            type="submit"
            disabled={!isValid || isLoading}
            aria-label={
              isLoading
                ? "Generating roast..."
                : "Generate roast for GitHub user"
            }
            whileHover={
              isValid && motionPreference === "normal"
                ? {
                    scale: 1.02,
                    boxShadow: "0 20px 40px rgba(168, 85, 247, 0.4)",
                  }
                : {}
            }
            whileTap={
              isValid && motionPreference === "normal" ? { scale: 0.98 } : {}
            }
            className="w-full py-5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white font-bold text-lg shadow-lg hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <Flame size={24} aria-hidden="true" />
            <span>{isLoading ? "Roasting..." : "Roast Me"}</span>
            <Flame size={24} aria-hidden="true" />
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}
