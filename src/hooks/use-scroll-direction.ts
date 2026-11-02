"use client";

import { useEffect, useRef, useState } from "react";
import { nextHeaderHidden } from "@/lib/scroll-motion";

/**
 * Whether a sticky header should currently be hidden (scrolling down) or shown (scrolling up / near the top).
 * One passive listener, coalesced to one read per frame; state only changes when the decision flips.
 */
export function useHeaderHidden(pinned: boolean): { hidden: boolean; scrolled: boolean } {
  const [state, setState] = useState({ hidden: false, scrolled: false });
  const pinnedRef = useRef(pinned);

  useEffect(() => {
    pinnedRef.current = pinned;
    if (pinned) queueMicrotask(() => setState((s) => (s.hidden ? { ...s, hidden: false } : s)));
  }, [pinned]);

  useEffect(() => {
    let previousY = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = Math.max(window.scrollY, 0); // iOS rubber-banding reports negative values
      setState((s) => {
        const hidden = nextHeaderHidden({ previousY, y, hidden: s.hidden, pinned: pinnedRef.current });
        const scrolled = y > 8;
        previousY = y;
        return hidden === s.hidden && scrolled === s.scrolled ? s : { hidden, scrolled };
      });
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); if (frame) cancelAnimationFrame(frame); };
  }, []);

  return state;
}
