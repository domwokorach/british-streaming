"use client";

import { AnimateUIProvider } from "@animate-ui/react/provider";
import { MotionConfig } from "motion/react";

/**
 * One place that decides how animation behaves app-wide. Both libraries honour the OS "reduce motion" setting:
 * Motion drops transform/layout animation while keeping gentle opacity fades, and Animate UI primitives follow
 * the same rule via `reducedMotion="user"`.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <AnimateUIProvider reducedMotion="user">{children}</AnimateUIProvider>
    </MotionConfig>
  );
}
