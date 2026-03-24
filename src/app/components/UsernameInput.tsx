import { useState, useEffect } from "react";
import { Github, Flame, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

interface UsernameInputProps {
  onRoast: (username: string) => void;
  isLoading: boolean;
}

export function UsernameInput({ onRoast, isLoading }: UsernameInputProps) {
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [validationError, setValidationError] = useState("");

  // Validate username format
  const validateUsername = (value: string): string => {
    if (!value.trim()) {
      return "";
    }
    if (value.length < 1) {
      return "Username is required";
    }
    if (value.length > 39) {
      return "GitHub username must be 39 characters or less";
    }
    if (!/^[a-zA-Z0-9-_]+$/.test(value)) {
      return "Username can only contain letters, numbers, hyphens, and underscores";
    }
    return "";
  };

  useEffect(() => {
    if (username.trim().length > 0) {
      setAvatar(`https://github.com/${username.trim()}.png`);
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
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
              <Github size={24} />
            </div>
            <input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Enter GitHub username..."
              disabled={isLoading}
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
              className="flex items-center gap-2 text-red-400 text-sm"
            >
              <AlertCircle size={16} />
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
            whileHover={
              isValid
                ? {
                    scale: 1.02,
                    boxShadow: "0 20px 40px rgba(168, 85, 247, 0.4)",
                  }
                : {}
            }
            whileTap={isValid ? { scale: 0.98 } : {}}
            className="w-full py-5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white font-bold text-lg shadow-lg hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <Flame size={24} />
            <span>{isLoading ? "Roasting..." : "Roast Me"}</span>
            <Flame size={24} />
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}
