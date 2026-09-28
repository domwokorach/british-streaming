"use client";

import Image from "next/image";
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
}

/** Backdrop/poster art, an optional title logo, a subtle gradient for legibility, and — once a hover
 * preview wins the single active slot — a muted trailer fading in over the artwork. */
export function MediaArtwork({ title, sizes, showPreview, trailerKey, priority = false }: MediaArtworkProps) {
  const image = title.backdropUrl ?? title.posterUrl;
  return (
    <div className="absolute inset-0 z-0">
      {image ? (
        <Image src={image} alt="" fill priority={priority} sizes={sizes} className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-zinc-600">
          <Clapperboard className="size-8" aria-hidden />
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
      {title.logoUrl && (
        <div className="pointer-events-none absolute inset-x-3 bottom-2 z-10 h-8 sm:h-10">
          <Image src={title.logoUrl} alt="" fill sizes="200px" className="object-contain object-left-bottom drop-shadow" />
        </div>
      )}
      <AnimatePresence>{showPreview && trailerKey && <HoverPreview trailerKey={trailerKey} title={title.name} />}</AnimatePresence>
    </div>
  );
}
