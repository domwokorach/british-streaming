"use client";

import { motion, useReducedMotion } from "motion/react";
import { ChevronDown, Play, Volume2, VolumeX, X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";

import { MediaArtwork } from "@/components/content/media-artwork";
import { MediaGenres } from "@/components/content/media-genres";
import { MediaMetadata } from "@/components/content/media-metadata";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { circleButtonClass, TitleActionButtons } from "@/components/title/action-buttons";
import { parseCompositeId } from "@/lib/tmdb-id";
import type { MediaTitle } from "@/lib/types";
import { usePlayback } from "@/providers/playback-provider";

const MIN_WIDTH = 300;
const SCALE = 1.5;
const VIEWPORT_MARGIN = 8;
const HEADER_CLEARANCE = 72;
const INFO_PANEL_HEIGHT = 150;

export interface AnchorRect { left: number; top: number; width: number; height: number }

/** Expanded size and position for a card, clamped so edge cards grow inward and never leave the viewport. */
export function previewGeometry(anchor: AnchorRect, viewport: { width: number; height: number }) {
  const width = Math.min(Math.max(anchor.width * SCALE, MIN_WIDTH), viewport.width - VIEWPORT_MARGIN * 2);
  const mediaHeight = (width * 9) / 16;
  const totalHeight = mediaHeight + INFO_PANEL_HEIGHT;
  const left = Math.min(Math.max(anchor.left + anchor.width / 2 - width / 2, VIEWPORT_MARGIN), viewport.width - width - VIEWPORT_MARGIN);
  // Centre the artwork on the card, then keep the whole popup on screen below the header.
  const idealTop = anchor.top + anchor.height / 2 - mediaHeight / 2;
  const top = Math.min(Math.max(idealTop, HEADER_CLEARANCE), Math.max(HEADER_CLEARANCE, viewport.height - totalHeight - VIEWPORT_MARGIN));
  return { left, top, width, mediaHeight };
}

interface Props {
  title: MediaTitle;
  anchor: AnchorRect;
  trailerKey: string | null;
  showTrailer: boolean;
  variant: "standard" | "continue-watching";
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  onRemove?: (tmdbId: number, mediaType: "movie" | "tv") => void;
}

/**
 * The expanded hover card. Rendered in a portal on document.body so the carousel's overflow clipping can never
 * cut it off. It lives inside the card's React tree, so it still shares the details Dialog context.
 */
export function MovieHoverPreview({ title, anchor, trailerKey, showTrailer, variant, onPointerEnter, onPointerLeave, onRemove }: Props) {
  const reduced = useReducedMotion();
  const [muted, setMuted] = useState(true);
  const { playMedia } = usePlayback();
  const parsed = parseCompositeId(title.id);
  const { left, top, width, mediaHeight } = previewGeometry(anchor, { width: window.innerWidth, height: window.innerHeight });
  // Start as a card-sized copy sitting exactly over the original, then spring out to full size.
  const startScale = anchor.width / width;
  const from = { scale: startScale, x: anchor.left - left, y: anchor.top - top + (anchor.height - mediaHeight * startScale) / 2 };

  const moreInfo = (
    <Tooltip>
      <TooltipTrigger render={<DialogTrigger render={<Button aria-label={`More information about ${title.name}`} size="icon" variant="outline" className={circleButtonClass} />} />}>
        <ChevronDown className="size-5" />
      </TooltipTrigger>
      <TooltipContent className="border-0 bg-white text-black">More Info</TooltipContent>
    </Tooltip>
  );

  return createPortal(
    <motion.div
      role="group"
      aria-label={`${title.name} preview`}
      data-hover-preview
      onMouseEnter={onPointerEnter}
      onMouseLeave={onPointerLeave}
      initial={reduced ? { opacity: 0 } : { opacity: 0.6, ...from }}
      animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      transition={reduced ? { duration: 0.1 } : { type: "spring", stiffness: 380, damping: 34, mass: 0.8 }}
      style={{ position: "fixed", left, top, width, zIndex: "var(--z-preview)" as unknown as number, transformOrigin: "0 0" }}
      className="overflow-hidden rounded-md bg-ws-card shadow-[0_18px_40px_rgba(0,0,0,0.7),0_0_32px_rgba(124,58,237,0.22)] ring-1 ring-ws-purple-electric/30"
    >
      <div className="relative bg-black" style={{ height: mediaHeight }}>
        <MediaArtwork title={title} sizes="400px" showPreview={showTrailer && !reduced} trailerKey={trailerKey} muted={muted} />
        {showTrailer && trailerKey && !reduced && (
          <button type="button" aria-label={muted ? "Unmute preview" : "Mute preview"} aria-pressed={!muted} onClick={() => setMuted((m) => !m)} className="absolute bottom-2 right-2 z-20 flex size-8 items-center justify-center rounded-full border border-white/50 bg-black/50 text-white transition-colors hover:border-white">
            {muted ? <VolumeX className="size-4" aria-hidden /> : <Volume2 className="size-4" aria-hidden />}
          </button>
        )}
      </div>
      <motion.div initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduced ? 0 : 0.08, duration: 0.2 }} className="space-y-3 px-4 pb-4 pt-3">
        {variant === "continue-watching" ? (
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button aria-label={`Resume ${title.name}`} size="icon" className="size-9 rounded-full bg-white text-black hover:bg-white/85" onClick={() => playMedia(title)}><Play className="size-4 fill-current" /></Button>
              {onRemove && parsed && <Button aria-label={`Remove ${title.name} from Continue Watching`} size="icon" variant="outline" className={circleButtonClass} onClick={() => onRemove(parsed.tmdbId, parsed.mediaType)}><X className="size-4" /></Button>}
            </div>
            {moreInfo}
          </div>
        ) : (
          <TitleActionButtons title={title} moreInfo={moreInfo} />
        )}
        <MediaMetadata title={title} compact />
        <MediaGenres genres={title.genres} className="text-[13px] text-white" />
      </motion.div>
    </motion.div>,
    document.body,
  );
}
