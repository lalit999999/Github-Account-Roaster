/**
 * Avatar with Fallback Component
 * Displays GitHub avatar with automatic fallback to initials if image fails
 */

import { useState } from "react";
import { motion } from "motion/react";

interface AvatarWithFallbackProps {
  username: string;
  avatarUrl: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Generate initials from username for fallback display
 */
function getInitials(username: string): string {
  const parts = username.split(/[-_]/);
  if (parts.length > 1) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return username.substring(0, 2).toUpperCase();
}

/**
 * Generate a color based on username for distinctive fallback backgrounds
 */
function getBackgroundColor(username: string): string {
  const colors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-yellow-500",
    "bg-indigo-500",
    "bg-cyan-500",
  ];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash << 5) - hash + username.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Size classes for avatar wrapper
 */
const SIZE_CLASSES = {
  sm: "w-12 h-12 text-xs",
  md: "w-20 h-20 text-sm",
  lg: "w-28 h-28 text-lg",
};

export function AvatarWithFallback({
  username,
  avatarUrl,
  size = "md",
  className = "",
}: AvatarWithFallbackProps) {
  const [imageError, setImageError] = useState(false);
  const initials = getInitials(username);
  const bgColor = getBackgroundColor(username);
  const sizeClass = SIZE_CLASSES[size];

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      className={`relative ${sizeClass} rounded-full overflow-hidden flex-shrink-0 ${className}`}
    >
      {imageError ? (
        // Fallback: Show initials with colored background
        <div
          className={`w-full h-full ${bgColor} flex items-center justify-center text-white font-bold rounded-full border-4 border-white/40 shadow-lg`}
          title={`Avatar failed to load for ${username}`}
        >
          {initials}
        </div>
      ) : (
        // Actual image
        <img
          src={avatarUrl}
          alt={`${username}'s avatar`}
          className="w-full h-full object-cover border-4 border-white/40 shadow-lg"
          onError={() => {
            console.warn(`Failed to load avatar image for ${username}`);
            setImageError(true);
          }}
        />
      )}
    </motion.div>
  );
}
