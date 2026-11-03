"use client";

import { useSyncExternalStore } from "react";

import { targetIdFor } from "@/lib/nav-targets";

export { targetIdFor };

// A click on a nav link arms a one-shot request; the destination consumes it. Back/forward and plain page loads never arm it.
const ARM_TTL_MS = 5000;
let armedAt = 0;
export const requestNavScroll = () => { armedAt = Date.now(); };
export const clearNavScroll = () => { armedAt = 0; };
export const consumeNavScroll = () => { const armed = armedAt > 0 && Date.now() - armedAt < ARM_TTL_MS; armedAt = 0; return armed; };

// Whether a programmatic nav scroll is in flight, so the auto-hiding header can stay pinned while it runs.
let scrolling = false;
const listeners = new Set<() => void>();
const setScrolling = (next: boolean) => { if (scrolling !== next) { scrolling = next; listeners.forEach((l) => l()); } };
export const useNavScrolling = () => useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, () => scrolling, () => false);

const IDLE_MS = 140;

/** Smoothly brings `el` to the top (below the header) and moves focus to it; instant under prefers-reduced-motion. */
export function scrollToNavTarget(el: HTMLElement) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  setScrolling(true);
  let corrected = false;
  // Scroll events only exist while the animation runs, so listening is scoped to it and removed when the scroll goes idle.
  let timer = window.setTimeout(settle, IDLE_MS);
  function bump() { window.clearTimeout(timer); timer = window.setTimeout(settle, IDLE_MS); }
  function stop() { window.removeEventListener("scroll", bump); window.removeEventListener("wheel", cancel); window.removeEventListener("touchstart", cancel); setScrolling(false); }
  // Images and rows hydrating mid-animation shift the target after the browser fixed its destination; re-aim once if we landed off.
  function settle() {
    // Where scrollIntoView actually parks the element: its own scroll-margin plus the document's scroll-padding.
    const margin = (parseFloat(getComputedStyle(el).scrollMarginTop) || 0) + (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0);
    if (!corrected && Math.abs(el.getBoundingClientRect().top - margin) > 8) { corrected = true; el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" }); bump(); return; }
    stop();
  }
  function cancel() { window.clearTimeout(timer); stop(); }
  window.addEventListener("scroll", bump, { passive: true });
  window.addEventListener("wheel", cancel, { passive: true, once: true });
  window.addEventListener("touchstart", cancel, { passive: true, once: true });
  el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  el.focus({ preventScroll: true });
}

/** True while the user is typing somewhere other than the navigation, in which case we must not move the page. */
export function isTypingElsewhere() {
  const a = document.activeElement as HTMLElement | null;
  if (!a || a === document.body) return false;
  const editable = a.matches("input, textarea, select, [contenteditable='true'], [contenteditable='']");
  return editable && !a.closest("nav, header");
}
