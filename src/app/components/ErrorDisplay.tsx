import { motion } from "motion/react";
import { AlertCircle, X, RotateCcw } from "lucide-react";
import { ERROR_MESSAGES, ErrorType } from "../utils/errors";
import {
  usePreferredMotion,
  getAnimationDuration,
} from "../hooks/usePreferredMotion";

interface ErrorDisplayProps {
  errorType: ErrorType;
  onDismiss: () => void;
  onRetry?: () => void;
  canRetry?: boolean;
}

export function ErrorDisplay({
  errorType,
  onDismiss,
  onRetry,
  canRetry = false,
}: ErrorDisplayProps) {
  const error =
    ERROR_MESSAGES[errorType] || ERROR_MESSAGES[ErrorType.UNKNOWN_ERROR];
  const motionPreference = usePreferredMotion();
  const animationDuration = getAnimationDuration(motionPreference, 0.3, 0.01);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: animationDuration }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="relative bg-red-900/20 border-2 border-red-500/50 rounded-2xl p-6 backdrop-blur-lg overflow-hidden group">
        {/* Animated border glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="absolute top-0 left-0 w-32 h-32 bg-red-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="flex-shrink-0">
              <motion.div
                animate={{ rotate: [0, -5, 5, -5, 0] }}
                transition={{
                  duration: getAnimationDuration(motionPreference, 2, 0.5),
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
              >
                <AlertCircle
                  className="text-red-400 w-6 h-6"
                  aria-hidden="true"
                />
              </motion.div>
            </div>

            {/* Content */}
            <div className="flex-grow">
              <h3 className="text-lg font-bold text-red-300 mb-1">
                {error.title}
              </h3>
              <p className="text-red-200/80 text-sm">{error.description}</p>
            </div>

            {/* Close button */}
            <button
              onClick={onDismiss}
              aria-label="Dismiss error"
              className="flex-shrink-0 text-red-400 hover:text-red-300 transition-colors p-1"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          {/* Action buttons */}
          {(canRetry || true) && (
            <div className="flex gap-3 pt-4 border-t border-red-500/30">
              {canRetry && onRetry && (
                <motion.button
                  onClick={onRetry}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 px-4 py-2 bg-red-600/40 hover:bg-red-600/60 text-red-200 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                  aria-label="Retry the request"
                >
                  <RotateCcw size={18} aria-hidden="true" />
                  <span>Retry</span>
                </motion.button>
              )}
              <motion.button
                onClick={onDismiss}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 bg-red-600/40 hover:bg-red-600/60 text-red-200 rounded-lg font-medium transition-colors ${
                  canRetry ? "flex-1" : ""
                }`}
                aria-label="Dismiss error"
              >
                Dismiss
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
