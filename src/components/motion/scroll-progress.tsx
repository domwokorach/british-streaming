"use client";

import { motion, useScroll, useSpring } from "motion/react";
import { useMotionTier } from "@/hooks/use-motion-profile";

/** Thin reading-progress bar pinned to the top of the viewport. Decorative, so hidden from assistive tech. */
export function ScrollProgress({ className = "bg-[#a78bfa]" }: { className?: string }) {
  const tier = useMotionTier();
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 220, damping: 32, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX: tier === "none" ? scrollYProgress : smooth }}
      className={`pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 origin-left will-change-transform ${className}`}
    />
  );
}
