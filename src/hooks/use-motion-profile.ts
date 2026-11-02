"use client";

import { createContext, createElement, useContext, useSyncExternalStore } from "react";
import { resolveMotionTier, tierProfile, type MotionTier } from "@/lib/scroll-motion";

interface NavigatorExtras { deviceMemory?: number; connection?: { saveData?: boolean; addEventListener?: (type: string, cb: () => void) => void; removeEventListener?: (type: string, cb: () => void) => void } }

function readTier(): MotionTier {
  const nav = navigator as Navigator & NavigatorExtras;
  return resolveMotionTier({
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    saveData: nav.connection?.saveData,
    deviceMemory: nav.deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
    viewportWidth: window.innerWidth,
  });
}

function subscribe(onChange: () => void) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const connection = (navigator as Navigator & NavigatorExtras).connection;
  reduced.addEventListener("change", onChange);
  connection?.addEventListener?.("change", onChange);
  return () => {
    reduced.removeEventListener("change", onChange);
    connection?.removeEventListener?.("change", onChange);
  };
}

/** Motion capability of the current device/user: `none` (reduced motion), `lite` (weak device / data saver) or `full`. */
export function useMotionTier(): MotionTier {
  const detected = useSyncExternalStore<MotionTier>(subscribe, readTier, () => "full");
  return useContext(TierOverride) ?? detected;
}

const TierOverride = createContext<MotionTier | null>(null);

/** Forces a tier for a subtree (used by the dev preview's "reduced-motion preview"). */
export function MotionTierOverride({ tier, children }: { tier: MotionTier | null; children: React.ReactNode }) {
  return createElement(TierOverride.Provider, { value: tier }, children);
}

const subscribeResize = (onChange: () => void) => {
  window.addEventListener("resize", onChange, { passive: true });
  return () => window.removeEventListener("resize", onChange);
};

/** Tier plus the distance/duration/parallax multipliers for the current viewport. */
export function useMotionProfile() {
  const tier = useMotionTier();
  const compact = useSyncExternalStore(subscribeResize, () => window.innerWidth < 640, () => false);
  return { tier, compact, ...tierProfile(tier, compact ? 480 : 1280) };
}
