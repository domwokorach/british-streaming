"use client";

import { AnimatePresence } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { DialogTrigger } from "@/components/ui/dialog";
import { MediaArtwork } from "@/components/content/media-artwork";
import { MovieHoverPreview, type AnchorRect } from "@/components/content/movie-hover-preview";
import { setActivePreview, useIsActivePreview } from "@/hooks/use-active-preview";
import { useHasHover } from "@/hooks/use-has-hover";
import { useTrailerKey } from "@/hooks/use-trailer-key";
import { parseCompositeId } from "@/lib/tmdb-id";
import type { MediaTitle } from "@/lib/types";
import { TitleDetails } from "@/components/title/title-details-modal";
import { cn } from "cn";

const OPEN_DELAY_MS = 400;
const CLOSE_DELAY_MS = 120;
const TRAILER_DELAY_MS = 600;

interface MediaCardProps {
  title: MediaTitle;
  /** "continue-watching" swaps the action row for Resume + Remove. */
  variant?: "standard" | "continue-watching";
  /** Landscape 16:9 thumbnail (default) or a portrait poster for Top 10 rows. */
  thumb?: "landscape" | "portrait";
  onRemove?: (tmdbId: number, mediaType: "movie" | "tv") => void;
  className?: string;
  /** The looping copy in a marquee: hidden from assistive tech and removed from the tab order, but still hoverable/tappable. */
  decorative?: boolean;
}

const LANDSCAPE_SIZES = "(max-width: 479px) 50vw, (max-width: 767px) 33vw, (max-width: 1023px) 25vw, (max-width: 1279px) 20vw, 17vw";

export function MediaCard({ title, variant = "standard", thumb = "landscape", onRemove, className, decorative = false }: MediaCardProps) {
  const isNewlyAdded = title.year === new Date().getFullYear() && !title.progress;
  const [anchor, setAnchor] = useState<AnchorRect | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trailerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const hasHover = useHasHover();
  const parsed = parseCompositeId(title.id);
  const isActivePreview = useIsActivePreview(title.id);
  const trailerKey = useTrailerKey(parsed?.mediaType ?? null, parsed?.tmdbId ?? null, isActivePreview);

  const clearTimers = useCallback(() => {
    for (const ref of [openTimer, closeTimer, trailerTimer]) {
      if (ref.current) clearTimeout(ref.current);
      ref.current = null;
    }
  }, []);

  const close = useCallback(() => {
    clearTimers();
    setAnchor(null);
    setActivePreview(null);
  }, [clearTimers]);

  const scheduleOpen = () => {
    if (!hasHover || anchor) return;
    clearTimers();
    openTimer.current = setTimeout(() => {
      const el = cardRef.current;
      if (!el) return;
      const { left, top, width, height } = el.getBoundingClientRect();
      setAnchor({ left, top, width, height });
      trailerTimer.current = setTimeout(() => setActivePreview(title.id), TRAILER_DELAY_MS);
    }, OPEN_DELAY_MS);
  };

  // The card and its portal preview are separate DOM trees; a short grace period lets the pointer cross between them without flicker.
  const scheduleClose = () => {
    if (openTimer.current) { clearTimeout(openTimer.current); openTimer.current = null; }
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(close, CLOSE_DELAY_MS);
  };
  const cancelClose = () => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
  };

  useEffect(() => () => { clearTimers(); }, [clearTimers]);

  // A fixed-position preview would drift away from its card, so dismiss it on scroll, resize and Escape.
  useEffect(() => {
    if (!anchor) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("resize", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [anchor, close]);

  const portrait = thumb === "portrait";
  return (
    <TitleDetails title={title} onOpenChange={(open) => open && close()}>
      <div ref={cardRef} aria-hidden={decorative || undefined} className={cn("relative", className)} onMouseEnter={() => { cancelClose(); scheduleOpen(); }} onMouseLeave={scheduleClose}>
        <DialogTrigger
          render={
            <button
              type="button"
              tabIndex={decorative ? -1 : undefined}
              aria-label={`${isNewlyAdded ? "Recently added: " : ""}See more about ${title.name}`}
              className={cn("relative block w-full overflow-hidden rounded-[6px] bg-ws-card outline-none focus-visible:ring-2 focus-visible:ring-white", portrait ? "aspect-[2/3]" : "aspect-video")}
            />
          }
        >
          <MediaArtwork title={title} sizes={portrait ? "12vw" : LANDSCAPE_SIZES} showPreview={false} trailerKey={null} orientation={portrait ? "portrait" : "landscape"} />
          {!portrait && (
            <span aria-hidden className={cn("pointer-events-none absolute inset-x-2 z-10 line-clamp-2 text-left text-[clamp(11px,1.1vw,16px)] font-extrabold uppercase leading-tight tracking-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]", isNewlyAdded ? "bottom-6" : "bottom-2")}>{title.logoUrl ? "" : title.name}</span>
          )}
          {isNewlyAdded && (
            <span className="absolute inset-x-0 bottom-1.5 z-20 mx-auto w-fit rounded-[2px] bg-ws-purple px-1.5 py-px text-[10px] font-semibold text-white">Recently Added</span>
          )}
          {title.progress && (
            <div className="absolute inset-x-0 bottom-0 z-20 h-[3px] bg-white/25">
              <div className="h-full bg-ws-blue-bright" style={{ width: `${Math.min(100, Math.max(0, title.progress.percent))}%` }} />
            </div>
          )}
        </DialogTrigger>
        <p className="sr-only">{title.name}</p>
      </div>

      <AnimatePresence>
        {anchor && hasHover && (
          <MovieHoverPreview key="preview" title={title} anchor={anchor} trailerKey={trailerKey} showTrailer={isActivePreview} variant={variant} onPointerEnter={cancelClose} onPointerLeave={scheduleClose} onRemove={onRemove} />
        )}
      </AnimatePresence>
    </TitleDetails>
  );
}
