"use client";

import { Check, ListPlus, Play, ThumbsUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMyList } from "@/hooks/use-my-list";
import { useReactions } from "@/hooks/use-reactions";
import { parseCompositeId } from "@/lib/tmdb-id";
import type { MediaTitle } from "@/lib/types";
import { usePlayback } from "@/providers/playback-provider";

export const circleButtonClass = "size-8 rounded-full border-white/45 bg-black/25 text-white transition-transform duration-150 hover:scale-105 hover:border-white hover:bg-white hover:text-black active:scale-95";
const circleToggleClass = "size-8 rounded-full border border-white/45 bg-black/25 text-white transition-transform duration-150 hover:scale-105 hover:border-white hover:bg-white hover:text-black active:scale-95 data-[pressed]:border-white data-[pressed]:bg-white data-[pressed]:text-black";

function ActionButton({ label, children, onClick }: { label: string; children: ReactNode; onClick?: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            aria-label={label}
            size="icon"
            variant="outline"
            className={circleButtonClass}
            onClick={(event: React.MouseEvent) => {
              // A card's artwork sits behind this button and opens title details on click —
              // stop the click here so Play never accidentally triggers that.
              event.stopPropagation();
              onClick?.();
            }}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent className="border-white/10 bg-zinc-800 text-white">{label}</TooltipContent>
    </Tooltip>
  );
}

function ActionToggle({ label, pressedLabel, pressed, onPressedChange, children }: { label: string; pressedLabel: string; pressed: boolean; onPressedChange: () => void; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Toggle
            aria-label={label}
            pressed={pressed}
            onPressedChange={onPressedChange}
            onClick={(event: React.MouseEvent) => event.stopPropagation()}
            className={circleToggleClass}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent className="border-white/10 bg-zinc-800 text-white">{pressedLabel}</TooltipContent>
    </Tooltip>
  );
}

/** Icon swaps with a quick rotate + fade, used for the My List add/remove morph. */
function MorphIcon({ pressed }: { pressed: boolean }) {
  return (
    <span className="relative inline-flex size-4 items-center justify-center">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={pressed ? "check" : "plus"}
          initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {pressed ? <Check className="size-4" /> : <ListPlus className="size-4" />}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Thumb icon that fills and pops slightly when liked. */
function LikeIcon({ pressed }: { pressed: boolean }) {
  return (
    <motion.span
      animate={{ scale: pressed ? [1, 1.25, 1] : 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="inline-flex"
    >
      <ThumbsUp className={`size-3.5 ${pressed ? "fill-current" : ""}`} />
    </motion.span>
  );
}

/** Play / Add to My List / Like, plus an optional slot for a "More Info" trigger supplied by the caller (kept out of this component to avoid a modal-in-modal import cycle). */
export function TitleActionButtons({ title, moreInfo }: { title: MediaTitle; moreInfo?: ReactNode }) {
  const { playMedia } = usePlayback();
  const { isSaved, toggle: toggleMyList } = useMyList();
  const { isLiked, toggleLike } = useReactions();
  const parsed = parseCompositeId(title.id);
  const saved = parsed ? isSaved(parsed.tmdbId, parsed.mediaType) : false;
  const liked = parsed ? isLiked(parsed.tmdbId, parsed.mediaType) : false;

  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-1.5">
        <ActionButton label={`Play ${title.name}`} onClick={() => playMedia(title)}><Play className="size-4 fill-current" /></ActionButton>
        <ActionToggle
          label={`Add ${title.name} to My List`}
          pressedLabel={saved ? "Remove from My List" : "Add to My List"}
          pressed={saved}
          onPressedChange={() => parsed && toggleMyList(parsed.tmdbId, parsed.mediaType)}
        >
          <MorphIcon pressed={saved} />
        </ActionToggle>
        <ActionToggle
          label={`Like ${title.name}`}
          pressedLabel="Liked"
          pressed={liked}
          onPressedChange={() => parsed && toggleLike(parsed.tmdbId, parsed.mediaType)}
        >
          <LikeIcon pressed={liked} />
        </ActionToggle>
      </div>
      {moreInfo}
    </div>
  );
}
