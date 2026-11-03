"use client";

import { Pause, Play } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { MediaCard } from "@/components/content/media-card";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import type { MediaTitle } from "@/lib/types";

/** Watches the body for the portal-rendered hover preview, so the strip holds still while one is open. */
function useHoverPreviewOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const update = () => setOpen(Boolean(document.querySelector("[data-hover-preview]")));
    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true });
    return () => observer.disconnect();
  }, []);
  return open;
}

/**
 * A titled, continuously moving strip of the regular MediaCard. Because it is the same card, hover previews,
 * details dialog, My List and Play all behave exactly as in the carousels; previews render in a body portal, so the
 * strip's clipping never cuts them off. Movement stops on hover, focus, while a preview is open, and via the pause button.
 */
export function InfiniteMediaGallery({ title, titles, direction = "left", id }: { title: string; titles: MediaTitle[]; direction?: "left" | "right"; id: string }) {
  const [userPaused, setUserPaused] = useState(false);
  const previewOpen = useHoverPreviewOpen();
  const reduced = useReducedMotion();
  if (titles.length === 0) return null;
  return (
    <div className="mt-6 first:mt-0 sm:mt-8">
      <div className="mb-2 flex items-center justify-between gap-3 px-4 sm:px-[58px]">
        <h2 id={`${id}-h`} className="text-lg font-medium text-white sm:text-[22px] sm:leading-7">{title}</h2>
        {!reduced && (
          <button type="button" onClick={() => setUserPaused((p) => !p)} aria-pressed={userPaused} aria-label={userPaused ? `Resume moving ${title}` : `Pause moving ${title}`}
            className="flex size-11 items-center justify-center rounded-full text-ws-text-2 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-ws-blue">
            {userPaused ? <Play className="size-4 fill-current" aria-hidden /> : <Pause className="size-4 fill-current" aria-hidden />}
          </button>
        )}
      </div>
      <InfiniteMovingCards
        label={title}
        items={titles}
        getKey={(t) => t.id}
        direction={direction}
        speed="slow"
        paused={userPaused || previewOpen}
        itemClassName="w-[44vw] min-w-[150px] max-w-[300px] sm:w-[28vw] lg:w-[20vw] min-[1920px]:w-[16vw]"
        renderItem={(t, { duplicate }) => <MediaCard title={t} decorative={duplicate} />}
        className="px-1"
      />
    </div>
  );
}
