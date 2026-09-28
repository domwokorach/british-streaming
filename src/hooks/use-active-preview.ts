"use client";

import { useSyncExternalStore } from "react";

/** Module-level singleton so at most one card's hover-trailer preview ever plays at once,
 * no matter how many MediaCards are mounted across the page. */
let activeId: string | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  for (const listener of listeners) listener();
}

export function setActivePreview(id: string | null) {
  if (activeId === id) return;
  activeId = id;
  notify();
}

/** Returns whether `id` is the single card currently allowed to show its hover preview. */
export function useIsActivePreview(id: string) {
  return useSyncExternalStore(
    subscribe,
    () => activeId === id,
    () => false,
  );
}
