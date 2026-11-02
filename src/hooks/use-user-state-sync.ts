"use client";

import { useEffect } from "react";

/** Calls `onChange` when this or another tab mutates user data, and when the tab regains focus. */
export function useUserStateSync(enabled: boolean, onChange: () => void) {
  useEffect(() => {
    if (!enabled) return;
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("ws-user-state") : null;
    const onVisible = () => { if (document.visibilityState === "visible") onChange(); };
    channel?.addEventListener("message", onChange);
    window.addEventListener("ws-user-state", onChange);
    window.addEventListener("focus", onChange);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      channel?.close();
      window.removeEventListener("ws-user-state", onChange);
      window.removeEventListener("focus", onChange);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, onChange]);
}
