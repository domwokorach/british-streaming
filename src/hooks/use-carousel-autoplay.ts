"use client";

import { useEffect, useRef } from "react";
import type { CarouselApi } from "@/components/ui/carousel";

interface AutoplayOptions {
  api: CarouselApi | undefined;
  /** Milliseconds between slides; falsy disables autoplay entirely. */
  intervalMs?: number;
  /** Extra reasons to hold (user paused, hover/focus, off-screen, reduced motion…). */
  paused: boolean;
}

/**
 * Advances an Embla carousel on a timer. Uses one timeout per slide (no polling, no scroll listeners),
 * rewinds at the end when the carousel doesn't loop, and always stops while the tab is hidden.
 */
export function useCarouselAutoplay({ api, intervalMs, paused }: AutoplayOptions) {
  const hidden = useRef(false);
  useEffect(() => {
    const onVisibility = () => { hidden.current = document.visibilityState === "hidden"; };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (!api || !intervalMs || paused) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        if (!hidden.current) {
          if (api.canScrollNext()) api.scrollNext();
          else api.scrollTo(0);
        }
        schedule();
      }, intervalMs);
    };
    schedule();
    // A manual drag/arrow/button restarts the full delay instead of advancing a moment later.
    const restart = () => { clearTimeout(timer); schedule(); };
    api.on("pointerDown", restart);
    return () => { clearTimeout(timer); api.off("pointerDown", restart); };
  }, [api, intervalMs, paused]);
}
