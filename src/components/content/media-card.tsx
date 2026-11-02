"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import { SPRING } from "@/lib/motion";
import { ChevronDown, Play, X } from "lucide-react";

import { DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MediaArtwork } from "@/components/content/media-artwork";
import { MediaMetadata } from "@/components/content/media-metadata";
import { setActivePreview, useIsActivePreview } from "@/hooks/use-active-preview";
import { useHasHover } from "@/hooks/use-has-hover";
import { useTrailerKey } from "@/hooks/use-trailer-key";
import { parseCompositeId } from "@/lib/tmdb-id";
import type { MediaTitle } from "@/lib/types";
import { circleButtonClass, TitleActionButtons } from "@/components/title/action-buttons";
import { TitleDetails } from "@/components/title/title-details-modal";
import { usePlayback } from "@/providers/playback-provider";

const EXPAND_DELAY_MS = 300;
const PREVIEW_DELAY_MS = 320;
/** How close to a viewport edge (px) a card has to be before the pop-up anchors away from that edge. */
const EDGE_THRESHOLD_PX = 100;

type OriginX = "left" | "center" | "right";

const panelVariants: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: "easeOut", staggerChildren: 0.05, delayChildren: 0.03 } },
  exit: { opacity: 0, y: 6, scale: 0.98, transition: { duration: 0.15, ease: "easeOut" } },
};
const fadeItem: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.1, ease: "easeOut" } },
};
const slideUpItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.18, ease: "easeOut" } },
  exit: { opacity: 0, y: 6, transition: { duration: 0.1, ease: "easeOut" } },
};

interface MediaCardProps {
  title: MediaTitle;
  /** "continue-watching" swaps the action row for Resume + Remove, per the Continue Watching spec. */
  variant?: "standard" | "continue-watching";
  onRemove?: (tmdbId: number, mediaType: "movie" | "tv") => void;
}

export function MediaCard({ title, variant = "standard", onRemove }: MediaCardProps) {
  const isNewlyAdded = title.year === new Date().getFullYear() && !title.progress;
  const [expanded, setExpanded] = useState(false);
  const [originX, setOriginX] = useState<OriginX>("center");
  const expandTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasHover = useHasHover();
  const reducedMotion = useReducedMotion();
  const parsed = parseCompositeId(title.id);
  const isActivePreview = useIsActivePreview(title.id);
  const trailerKey = useTrailerKey(parsed?.mediaType ?? null, parsed?.tmdbId ?? null, isActivePreview);
  const { playMedia } = usePlayback();

  function clearTimers() {
    if (expandTimer.current) clearTimeout(expandTimer.current);
    if (previewTimer.current) clearTimeout(previewTimer.current);
    expandTimer.current = null;
    previewTimer.current = null;
  }

  /** Anchors the scale/pop-up toward whichever side has room, so cards near a viewport edge never overflow it. */
  function measureOrigin() {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.left < EDGE_THRESHOLD_PX) setOriginX("left");
    else if (window.innerWidth - rect.right < EDGE_THRESHOLD_PX) setOriginX("right");
    else setOriginX("center");
  }

  function scheduleExpand() {
    if (!hasHover) return;
    clearTimers();
    measureOrigin();
    expandTimer.current = setTimeout(() => {
      setExpanded(true);
      if (!reducedMotion) previewTimer.current = setTimeout(() => setActivePreview(title.id), PREVIEW_DELAY_MS);
    }, EXPAND_DELAY_MS);
  }

  function handleLeave() {
    clearTimers();
    setExpanded(false);
    setActivePreview(null);
  }

  useEffect(() => () => clearTimers(), []);

  function handleBlurCapture(event: React.FocusEvent<HTMLDivElement>) {
    if (containerRef.current && event.relatedTarget && containerRef.current.contains(event.relatedTarget as Node)) return;
    handleLeave();
  }

  const showPanel = expanded && hasHover;
  const artworkSizes = "(max-width: 640px) 42vw, (max-width: 1024px) 28vw, 17vw";
  const transformOrigin = `${originX === "left" ? "0%" : originX === "right" ? "100%" : "50%"} 30%`;

  return (
    <TitleDetails title={title}>
      <div
        ref={containerRef}
        className="group/card relative"
        onMouseEnter={scheduleExpand}
        onMouseLeave={handleLeave}
        onFocusCapture={scheduleExpand}
        onBlurCapture={handleBlurCapture}
      >
        <motion.div
          animate={{ scale: showPanel && !reducedMotion ? 1.08 : 1 }}
          // Spring lift on hover; a small press-down on touch/click gives immediate tactile feedback.
          whileTap={reducedMotion ? undefined : { scale: 0.97 }}
          transition={SPRING.card}
          style={{ transformOrigin }}
          className={`relative ${showPanel ? "z-30" : "z-0"}`}
        >
          <DialogTrigger
            render={<button type="button" aria-label={`${isNewlyAdded ? "Recently added: " : ""}See more about ${title.name}`} className="relative block aspect-[2/3] w-full overflow-hidden rounded-lg bg-[#16275a] shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-white" />}
          >
            <MediaArtwork title={title} sizes={artworkSizes} showPreview={showPanel && !reducedMotion} trailerKey={trailerKey} />
            {isNewlyAdded && (
              <span className="absolute inset-x-1.5 bottom-1.5 z-20 rounded-[3px] bg-[#7c3aed] px-1.5 py-0.5 text-center text-[11px] font-semibold uppercase tracking-wide text-white">Recently added</span>
            )}
            {title.progress && (
              <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/25">
                <div className="h-full bg-[#7c3aed]" style={{ width: `${Math.min(100, Math.max(0, title.progress.percent))}%` }} />
              </div>
            )}
          </DialogTrigger>

          {/* Always-on title line — never gated by hover/pointer capability, so the name is never
              missing on touch devices or when a hover preview never mounts. */}
          <p className="relative z-20 sr-only">{title.name}</p>

          <AnimatePresence>
            {showPanel && (
              <motion.div
                variants={panelVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute left-0 right-0 top-full z-30 origin-top overflow-hidden rounded-b-lg bg-[#0a1331] shadow-2xl"
              >
                <div className="relative z-40 space-y-2 px-3 pb-3 pt-3">
                  {title.progress?.seasonNumber && title.progress.episodeNumber && (
                    <motion.p variants={fadeItem} className="text-[11px] font-medium text-zinc-400">
                      S{title.progress.seasonNumber}:E{title.progress.episodeNumber}
                    </motion.p>
                  )}

                  <motion.div variants={fadeItem}>
                    <MediaMetadata title={title} compact />
                  </motion.div>

                  {title.overview && (
                    <motion.p variants={slideUpItem} className="line-clamp-2 text-xs leading-5 text-zinc-300">
                      {title.overview}
                    </motion.p>
                  )}

                  <motion.div variants={fadeItem}>
                    {variant === "continue-watching" ? (
                      <ContinueWatchingActions title={title} parsed={parsed} onPlay={() => playMedia(title)} onRemove={onRemove} />
                    ) : (
                      <TitleActionButtons
                        title={title}
                        moreInfo={
                          <Tooltip>
                            <TooltipTrigger
                              render={<DialogTrigger render={<Button aria-label={`More information about ${title.name}`} size="icon" variant="outline" className={circleButtonClass} />} />}
                            >
                              <ChevronDown className="size-4" />
                            </TooltipTrigger>
                            <TooltipContent className="border-white/10 bg-zinc-800 text-white">More Info</TooltipContent>
                          </Tooltip>
                        }
                      />
                    )}
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </TitleDetails>
  );
}

function ContinueWatchingActions({
  title,
  parsed,
  onPlay,
  onRemove,
}: {
  title: MediaTitle;
  parsed: { mediaType: "movie" | "tv"; tmdbId: number } | null;
  onPlay: () => void;
  onRemove?: (tmdbId: number, mediaType: "movie" | "tv") => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-1.5">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label={`Resume ${title.name}`}
                size="icon"
                variant="outline"
                className={circleButtonClass}
                onClick={(event: React.MouseEvent) => {
                  event.stopPropagation();
                  onPlay();
                }}
              />
            }
          >
            <Play className="size-4 fill-current" />
          </TooltipTrigger>
          <TooltipContent className="border-white/10 bg-zinc-800 text-white">Resume</TooltipContent>
        </Tooltip>
        {onRemove && parsed && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  aria-label={`Remove ${title.name} from Continue Watching`}
                  size="icon"
                  variant="outline"
                  className={circleButtonClass}
                  onClick={(event: React.MouseEvent) => {
                    event.stopPropagation();
                    onRemove(parsed.tmdbId, parsed.mediaType);
                  }}
                />
              }
            >
              <X className="size-4" />
            </TooltipTrigger>
            <TooltipContent className="border-white/10 bg-zinc-800 text-white">Remove</TooltipContent>
          </Tooltip>
        )}
      </div>
      <Tooltip>
        <TooltipTrigger
          render={<DialogTrigger render={<Button aria-label={`More information about ${title.name}`} size="icon" variant="outline" className={circleButtonClass} />} />}
        >
          <ChevronDown className="size-4" />
        </TooltipTrigger>
        <TooltipContent className="border-white/10 bg-zinc-800 text-white">More Info</TooltipContent>
      </Tooltip>
    </div>
  );
}
