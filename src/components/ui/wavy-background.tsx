"use client";

import { useEffect, useRef, useState } from "react";
import { createNoise3D } from "simplex-noise";

import { cn } from "@/lib/utils";

const DEFAULT_COLORS = ["#2563EB", "#7C3AED", "#A78BFA", "#60A5FA", "#7C3AED"];
const SPEED = { slow: 0.001, fast: 0.002 } as const;

interface WavyCanvasProps {
  className?: string;
  colors?: string[];
  waveWidth?: number;
  backgroundFill?: string;
  blur?: number;
  speed?: keyof typeof SPEED;
  waveOpacity?: number;
  waveCount?: number;
  /** Backing-store scale. The canvas is blurred anyway, so half resolution is visually identical and ~4x cheaper. */
  resolution?: number;
}

/**
 * Adapted from Aceternity's Wavy Background. Differences from the original: sized to its container (not the window)
 * via ResizeObserver, pauses when off-screen or the tab is hidden, draws one static frame under prefers-reduced-motion,
 * never intercepts pointer events, and is hidden from assistive technology.
 */
export function WavyCanvas({ className, colors = DEFAULT_COLORS, waveWidth = 50, backgroundFill = "#101116", blur = 10, speed = "slow", waveOpacity = 0.5, waveCount = 5, resolution = 0.5 }: WavyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cssBlur, setCssBlur] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return;

    // Safari ignores CanvasRenderingContext2D.filter; fall back to a CSS blur on the element.
    const nativeFilter = "filter" in ctx;
    if (!nativeFilter) setCssBlur(true);

    const noise = createNoise3D();
    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let w = 0, h = 0, t = 0, frame = 0, last = 0;
    let onScreen = true;

    const resize = () => {
      const rect = host.getBoundingClientRect();
      w = canvas.width = Math.max(1, Math.round(rect.width * resolution));
      h = canvas.height = Math.max(1, Math.round(rect.height * resolution));
      if (nativeFilter) ctx.filter = `blur(${blur * resolution}px)`;
      draw();
    };

    const draw = () => {
      ctx.globalAlpha = waveOpacity;
      ctx.fillStyle = backgroundFill;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < waveCount; i++) {
        ctx.beginPath();
        ctx.lineWidth = waveWidth * resolution;
        ctx.strokeStyle = colors[i % colors.length];
        for (let x = 0; x < w; x += 5) ctx.lineTo(x, noise(x / (800 * resolution), 0.3 * i, t) * 100 * resolution + h * 0.5);
        ctx.stroke();
        ctx.closePath();
      }
    };

    const tick = (now: number) => {
      frame = 0;
      // Time-based so the wave speed doesn't change with the display's refresh rate.
      t += SPEED[speed] * (last ? Math.min(now - last, 50) / 16.7 : 1);
      last = now;
      draw();
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      const run = onScreen && !document.hidden && !reducedQuery.matches;
      if (run && !frame) { last = 0; frame = requestAnimationFrame(tick); }
      else if (!run && frame) { cancelAnimationFrame(frame); frame = 0; }
    };

    const resizeObserver = new ResizeObserver(resize);
    const intersection = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; sync(); });
    resizeObserver.observe(host);
    intersection.observe(host);
    document.addEventListener("visibilitychange", sync);
    reducedQuery.addEventListener("change", sync);
    resize();
    sync();
    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reducedQuery.removeEventListener("change", sync);
    };
  }, [colors, waveWidth, backgroundFill, blur, speed, waveOpacity, waveCount, resolution]);

  return <canvas ref={canvasRef} aria-hidden className={cn("pointer-events-none absolute inset-0 size-full", className)} style={cssBlur ? { filter: `blur(${blur}px)` } : undefined} />;
}

/** The original component's shape: a relatively positioned container with the waves behind its children. */
export function WavyBackground({ children, className, containerClassName, ...canvas }: WavyCanvasProps & { children?: React.ReactNode; containerClassName?: string }) {
  return (
    <div className={cn("relative isolate flex flex-col items-center justify-center overflow-hidden", containerClassName)}>
      <WavyCanvas {...canvas} className="-z-10" />
      <div className={cn("relative z-10", className)}>{children}</div>
    </div>
  );
}
