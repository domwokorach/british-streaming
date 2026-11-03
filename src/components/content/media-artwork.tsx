"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { Clapperboard } from "lucide-react";

import { HoverPreview } from "@/components/content/hover-preview";
import type { MediaTitle } from "@/lib/types";

interface MediaArtworkProps {
  title: MediaTitle;
  sizes: string;
  showPreview: boolean;
  trailerKey: string | null;
  priority?: boolean;
  /** Which artwork to prefer: landscape backdrop (default) or portrait poster. */
  orientation?: "landscape" | "portrait";
  muted?: boolean;
}

/** Backdrop/poster art, an optional title logo, a subtle gradient for legibility, and — once a hover
 * preview wins the single active slot — a muted trailer fading in over the artwork. */
export function MediaArtwork({ title, sizes, showPreview, trailerKey, priority = false, orientation = "landscape", muted = true }: MediaArtworkProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const preferred = orientation === "landscape" ? title.backdropUrl : title.posterUrl;
  const fallback = orientation === "landscape" ? title.posterUrl : title.backdropUrl;
  const candidate = preferred ?? fallback;
  // One retry with the backdrop if the poster fails; after that, the placeholder icon.
  const image = failed === candidate && candidate === preferred ? fallback : failed === candidate ? null : candidate;
  return (
    <div className="absolute inset-0 z-0">
      {image ? (
        <Image key={image} src={image} alt="" fill priority={priority} sizes={sizes} onError={() => setFailed(image)} className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-ws-card text-ws-text-2">
          <Clapperboard className="size-8" aria-hidden />
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      {title.logoUrl && orientation === "landscape" && !title.backdropUrl && (
        <div className="pointer-events-none absolute inset-x-3 bottom-2 z-10 h-8 sm:h-10">
          <Image src={title.logoUrl} alt="" fill sizes="200px" className="object-contain object-left-bottom drop-shadow" />
        </div>
      )}
      <AnimatePresence>{showPreview && trailerKey && <HoverPreview trailerKey={trailerKey} title={title.name} muted={muted} />}</AnimatePresence>
    </div>
  );
}
