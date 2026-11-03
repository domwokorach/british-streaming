"use client";

import { motion } from "motion/react";
import { useEffect, useRef } from "react";

/**
 * A chromeless YouTube trailer preview. Only ever mounted once a card has been hovered long
 * enough and won it the single global "active preview" slot — never rendered eagerly, never more
 * than one at a time, and it never claims to be the full movie or show. It always starts muted;
 * audio is only enabled by an explicit user action through `muted`.
 */
export function HoverPreview({ trailerKey, title, muted = true }: { trailerKey: string; title: string; muted?: boolean }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const src = `https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1&rel=0&loop=1&enablejsapi=1&playlist=${trailerKey}`;

  useEffect(() => {
    // Skip the initial muted state; the embed already starts muted.
    if (muted) frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "mute", args: [] }), "*");
    else frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "unMute", args: [] }), "*");
  }, [muted]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease: "easeOut" }} className="absolute inset-0 z-10 overflow-hidden bg-black">
      <iframe ref={frame} className="pointer-events-none absolute inset-0 h-full w-full scale-[1.4]" src={src} title={`${title} trailer preview`} aria-hidden tabIndex={-1} allow="autoplay; encrypted-media" />
    </motion.div>
  );
}
