import { motion } from "motion/react";
import { Flame, Code2, Sparkles } from "lucide-react";
import {
  usePreferredMotion,
  getAnimationDuration,
} from "../hooks/usePreferredMotion";

interface LoadingSkeletonProps {
  message: string;
}

export function LoadingSkeleton({ message }: LoadingSkeletonProps) {
  const motionPreference = usePreferredMotion();
  const animationDuration = getAnimationDuration(motionPreference, 0.3, 0.01);
  const rotateDuration = getAnimationDuration(motionPreference, 2, 0.5);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: animationDuration }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
        {/* Header skeleton */}
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 rounded-full bg-white/10 animate-pulse" />
          <div className="flex-1">
            <div className="h-6 bg-white/10 rounded-lg w-48 mb-3 animate-pulse" />
            <div className="h-4 bg-white/10 rounded-lg w-32 animate-pulse" />
          </div>
        </div>

        {/* Content skeleton */}
        <div className="space-y-4 mb-8">
          <div className="h-4 bg-white/10 rounded-lg w-full animate-pulse" />
          <div className="h-4 bg-white/10 rounded-lg w-11/12 animate-pulse" />
          <div className="h-4 bg-white/10 rounded-lg w-10/12 animate-pulse" />
          <div className="h-4 bg-white/10 rounded-lg w-9/12 animate-pulse" />
        </div>

        {/* Loading message */}
        <div className="text-center py-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: rotateDuration,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <Code2 className="text-purple-400" size={32} />
            </motion.div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{
                duration: getAnimationDuration(motionPreference, 1.5, 0.5),
                repeat: Infinity,
              }}
            >
              <Flame className="text-orange-400" size={32} />
            </motion.div>
            <motion.div
              animate={{ rotate: -360 }}
              transition={{
                duration: rotateDuration,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <Sparkles className="text-blue-400" size={32} />
            </motion.div>
          </div>
          <p className="text-gray-300 text-lg font-medium">{message}</p>
        </div>

        {/* Shimmer effect overlay */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          <motion.div
            className="h-full w-full bg-gradient-to-r from-transparent via-white/5 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </div>
    </motion.div>
  );
}
