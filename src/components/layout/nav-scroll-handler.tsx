"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { clearNavScroll, consumeNavScroll, isTypingElsewhere, scrollToNavTarget } from "@/lib/nav-scroll";
import { targetIdFor } from "@/lib/nav-targets";

/** After a nav click lands on a new route, waits for that page's content section to exist, then scrolls to it once. */
export function NavScrollHandler() {
  const pathname = usePathname();

  // Back/forward restore their own scroll position and must never trigger the nav scroll.
  useEffect(() => {
    window.addEventListener("popstate", clearNavScroll);
    return () => window.removeEventListener("popstate", clearNavScroll);
  }, []);

  useEffect(() => {
    const id = targetIdFor(pathname);
    if (!consumeNavScroll()) return;
    if (!id) return;
    let frame = 0;
    let observer: MutationObserver | null = null;
    let giveUp = 0;
    const go = (el: HTMLElement) => { if (!isTypingElsewhere()) scrollToNavTarget(el); };
    // One frame lets Next finish its own scroll-to-top for the new route before we animate down from it.
    frame = requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) return go(el);
      // Content that mounts late (client-rendered pages): wait for it to appear instead of guessing a delay.
      observer = new MutationObserver(() => { const late = document.getElementById(id); if (late) { observer?.disconnect(); go(late); } });
      observer.observe(document.body, { childList: true, subtree: true });
      giveUp = window.setTimeout(() => observer?.disconnect(), 5000);
    });
    return () => { cancelAnimationFrame(frame); observer?.disconnect(); window.clearTimeout(giveUp); };
  }, [pathname]);

  return null;
}
