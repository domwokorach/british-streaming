"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Loaded on demand so devices that never run the animation never download it.
const WavyCanvas = dynamic(() => import("@/components/ui/wavy-background").then((m) => m.WavyCanvas), { ssr: false });

const WAVE_COLORS = ["#2563EB", "#7C3AED", "#A78BFA", "#60A5FA", "#7C3AED"];

type Tier = "static" | "tablet" | "desktop";

interface NavigatorHints { hardwareConcurrency?: number; deviceMemory?: number; connection?: { saveData?: boolean } }

/** Animated waves only where they are cheap: no reduced-motion/data-saver, enough cores and memory, and a tablet-or-larger screen. */
function pickTier(): Tier {
  const nav = navigator as Navigator & NavigatorHints;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "static";
  if (nav.connection?.saveData) return "static";
  if ((nav.hardwareConcurrency ?? 8) < 4 || (nav.deviceMemory ?? 8) < 4) return "static";
  if (!window.matchMedia("(min-width: 640px)").matches) return "static";
  return window.matchMedia("(min-width: 1024px)").matches ? "desktop" : "tablet";
}

/** Static gradient atmosphere is always rendered (no layout shift, no JS needed); the wavy canvas is a progressive enhancement. */
export function ErrorBackground() {
  const [tier, setTier] = useState<Tier>("static");
  useEffect(() => {
    const update = () => setTier(pickTier());
    update();
    const queries = ["(prefers-reduced-motion: reduce)", "(min-width: 640px)", "(min-width: 1024px)"].map((q) => window.matchMedia(q));
    queries.forEach((q) => q.addEventListener("change", update));
    return () => queries.forEach((q) => q.removeEventListener("change", update));
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-ws-bg">
      {tier !== "static" && (
        <WavyCanvas
          colors={WAVE_COLORS}
          waveCount={tier === "desktop" ? 4 : 3}
          waveOpacity={tier === "desktop" ? 0.35 : 0.22}
          resolution={tier === "desktop" ? 0.4 : 0.3}
          blur={12}
          className="opacity-70 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-1000"
        />
      )}
      <div className="absolute -top-32 -left-24 size-[28rem] rounded-full bg-ws-blue/25 blur-3xl sm:size-[36rem]" />
      <div className="absolute -right-24 -bottom-32 size-[28rem] rounded-full bg-ws-purple/25 blur-3xl sm:size-[36rem]" />
      <div className="absolute top-1/3 left-1/2 size-72 -translate-x-1/2 rounded-full bg-ws-purple-deep/40 blur-3xl" />
      {/* Vignette keeps body copy above AA contrast wherever the waves pass behind it. */}
      <div className="absolute inset-0 bg-gradient-to-b from-ws-bg/70 via-ws-bg/20 to-ws-bg/80" />
    </div>
  );
}
