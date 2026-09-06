"use client";

import { ListPlus, Play, ThumbsUp } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMyList } from "@/hooks/use-my-list";
import { useReactions } from "@/hooks/use-reactions";
import { parseCompositeId } from "@/lib/tmdb-id";
import type { MediaTitle } from "@/lib/types";
import { usePlayback } from "@/providers/playback-provider";

export const circleButtonClass = "size-8 rounded-full border-white/45 bg-black/25 text-white hover:border-white hover:bg-white hover:text-black";
const circleToggleClass = "size-8 rounded-full border border-white/45 bg-black/25 text-white hover:border-white hover:bg-white hover:text-black data-[pressed]:border-white data-[pressed]:bg-white data-[pressed]:text-black";

function ActionButton({ label, children, onClick }: { label: string; children: ReactNode; onClick?: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button aria-label={label} size="icon" variant="outline" className={circleButtonClass} onClick={onClick} />}>{children}</TooltipTrigger>
      <TooltipContent className="border-white/10 bg-zinc-800 text-white">{label}</TooltipContent>
    </Tooltip>
  );
}

function ActionToggle({ label, pressedLabel, pressed, onPressedChange, children }: { label: string; pressedLabel: string; pressed: boolean; onPressedChange: () => void; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Toggle aria-label={label} pressed={pressed} onPressedChange={onPressedChange} className={circleToggleClass} />}>{children}</TooltipTrigger>
      <TooltipContent className="border-white/10 bg-zinc-800 text-white">{pressedLabel}</TooltipContent>
    </Tooltip>
  );
}

/** Play / Add to My List / Like, plus an optional slot for a "More Info" trigger supplied by the caller (kept out of this component to avoid a modal-in-modal import cycle). */
export function TitleActionButtons({ title, moreInfo }: { title: MediaTitle; moreInfo?: ReactNode }) {
  const { playMedia } = usePlayback();
  const { isSaved, toggle: toggleMyList } = useMyList();
  const { isLiked, toggleLike } = useReactions();
  const parsed = parseCompositeId(title.id);

  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-1.5">
        <ActionButton label={`Play ${title.name}`} onClick={() => playMedia(title)}><Play className="size-4 fill-current" /></ActionButton>
        <ActionToggle
          label={`Add ${title.name} to My List`}
          pressedLabel="My List"
          pressed={parsed ? isSaved(parsed.tmdbId, parsed.mediaType) : false}
          onPressedChange={() => parsed && toggleMyList(parsed.tmdbId, parsed.mediaType)}
        >
          <ListPlus className="size-4" />
        </ActionToggle>
        <ActionToggle
          label={`Like ${title.name}`}
          pressedLabel="Like"
          pressed={parsed ? isLiked(parsed.tmdbId, parsed.mediaType) : false}
          onPressedChange={() => parsed && toggleLike(parsed.tmdbId, parsed.mediaType)}
        >
          <ThumbsUp className="size-3.5" />
        </ActionToggle>
      </div>
      {moreInfo}
    </div>
  );
}
