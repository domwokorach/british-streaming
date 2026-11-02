"use client";

import { animate, useInView } from "motion/react";
import { useEffect, useRef } from "react";
import { useMotionTier } from "@/hooks/use-motion-profile";

/** Counts up when scrolled into view. Screen readers get the final value immediately via an sr-only copy. */
export function Counter({ to, from = 0, duration = 1.6, format = (n: number) => Math.round(n).toLocaleString("en-GB"), className }: { to: number; from?: number; duration?: number; format?: (n: number) => string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const tier = useMotionTier();
  useEffect(() => {
    const node = ref.current;
    if (!node || !inView) return;
    if (tier === "none") { node.textContent = format(to); return; }
    const controls = animate(from, to, { duration, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => { node.textContent = format(v); } });
    return () => controls.stop();
  }, [inView, tier, from, to, duration, format]);
  return (
    <span className={className}>
      <span className="sr-only">{format(to)}</span>
      <span ref={ref} aria-hidden className="tabular-nums">{format(from)}</span>
    </span>
  );
}
