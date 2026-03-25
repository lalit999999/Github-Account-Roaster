/**
 * usePreferredMotion Hook
 * Detects user's motion preferences and disables animations accordingly
 * Respects the prefers-reduced-motion media query
 */

import { useEffect, useState } from "react";

type MotionPreference = "reduced" | "normal";

/**
 * Hook to detect if user prefers reduced motion
 * Returns true if user has enabled "reduce motion" in their system preferences
 */
export function usePreferredMotion(): MotionPreference {
  const [motionPreference, setMotionPreference] =
    useState<MotionPreference>("normal");

  useEffect(() => {
    // Check initial preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setMotionPreference(mediaQuery.matches ? "reduced" : "normal");

    // Listen for changes
    const handleChange = (e: MediaQueryListEvent) => {
      setMotionPreference(e.matches ? "reduced" : "normal");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return motionPreference;
}

/**
 * Get animation config based on motion preference
 * Returns minimal/instant transitions for reduced motion, normal for others
 */
export function getAnimationConfig(
  motionPreference: MotionPreference,
  normalConfig: { duration: number; delay?: number },
  reducedConfig?: { duration?: number; delay?: number },
) {
  if (motionPreference === "reduced") {
    return {
      duration: 0.01, // Near-instant
      delay: 0,
      ...reducedConfig,
    };
  }
  return normalConfig;
}

/**
 * Alternative: Get animation duration based on preference
 * Useful for Framer Motion's transition prop
 */
export function getAnimationDuration(
  motionPreference: MotionPreference,
  normalDuration: number = 0.3,
  reducedDuration: number = 0.01,
): number {
  return motionPreference === "reduced" ? reducedDuration : normalDuration;
}
