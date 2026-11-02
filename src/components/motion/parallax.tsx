"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { useMotionProfile } from "@/hooks/use-motion-profile";
import { cn } from "cn";

interface ParallaxLayerProps {
  /** Peak vertical offset in px at full intensity; positive layers trail the page (background), negative lead it. */
  offset?: number;
  /** Optional scale change across the element's passage through the viewport (e.g. 1.15 zooms in as it scrolls). */
  scaleTo?: number;
  /** User/preview multiplier for the effect strength. */
  intensity?: number;
  fadeOut?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Scroll-linked depth layer. Only transform/opacity are animated, driven by a MotionValue (no React re-renders,
 * no scroll listeners of our own). Strength is zero on reduced-motion and low-power devices.
 */
export function ParallaxLayer({ offset = 60, scaleTo = 1, intensity = 1, fadeOut = false, className, children }: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { parallax } = useMotionProfile();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const amp = offset * intensity * parallax;
  const y = useTransform(scrollYProgress, [0, 1], [-amp, amp]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], parallax === 0 ? [1, 1, 1] : [1, (1 + scaleTo) / 2, scaleTo]);
  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], fadeOut && parallax > 0 ? [0.2, 1, 1, 0.2] : [1, 1, 1, 1]);
  return (
    <div ref={ref} className={cn("relative", className)}>
      <motion.div style={{ y, scale, opacity, willChange: parallax > 0 ? "transform" : undefined }} className="h-full w-full">{children}</motion.div>
    </div>
  );
}
