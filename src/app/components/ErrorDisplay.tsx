import { motion } from "motion/react";
import { AlertCircle, X } from "lucide-react";
import { ERROR_MESSAGES, ErrorType } from "../utils/errors";

interface ErrorDisplayProps {
  errorType: ErrorType;
  onDismiss: () => void;
}

export function ErrorDisplay({ errorType, onDismiss }: ErrorDisplayProps) {
  const error =
    ERROR_MESSAGES[errorType] || ERROR_MESSAGES[ErrorType.UNKNOWN_ERROR];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="relative bg-red-900/20 border-2 border-red-500/50 rounded-2xl p-6 backdrop-blur-lg overflow-hidden group">
        {/* Animated border glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="absolute top-0 left-0 w-32 h-32 bg-red-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="relative z-10 flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <motion.div
              animate={{ rotate: [0, -5, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
            >
              <AlertCircle className="text-red-400 w-6 h-6" />
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
            className="flex-shrink-0 text-red-400 hover:text-red-300 transition-colors p-1"
            aria-label="Dismiss error"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
