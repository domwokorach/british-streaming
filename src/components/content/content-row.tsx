"use client";

import { Pause, Play } from "lucide-react";
import { useInView } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { Reveal } from "@/components/motion/reveal";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { useCarouselAutoplay } from "@/hooks/use-carousel-autoplay";
import { useMotionTier } from "@/hooks/use-motion-profile";
import type { ContentRowData } from "@/lib/types";
import { ContinueWatchingCard } from "./continue-watching-card";
import { MediaCard } from "./media-card";
import { TopTenCard } from "./top-ten-card";

interface ContentRowProps {
  row: ContentRowData;
  /** Only relevant for the "continue-watching" variant: removes a title from Continue Watching. */
  onRemove?: (tmdbId: number, mediaType: "movie" | "tv") => void;
  /** Slide automatically every N ms. Pauses on hover, focus, touch, hidden tabs, off-screen and reduced motion. */
  autoplayMs?: number;
  /** Wrap around at the ends. Ignored for short rows, where looping would repeat visible cards. */
  loop?: boolean;
}

const MIN_ITEMS_TO_LOOP = 8;

/** Row gutter shared with the header so headings, first cards and the logo line up. */
const GUTTER = "px-4 sm:px-[58px]";
/** Landscape cards per viewport: 2 / 3 / 4 / 5 / 6 across <480, 480, 768, 1024 and 1280px, 7 on ultrawide. */
const BASIS_STANDARD = "basis-1/2 min-[480px]:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6 min-[1920px]:basis-[14.2857%]";
/** Top 10 cells hold a numeral plus a poster, so they run one step wider. */
const BASIS_TOP_TEN = "basis-[70%] min-[480px]:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5 min-[1920px]:basis-1/6";

export function ContentRow({ row, onRemove, autoplayMs, loop = false }: ContentRowProps) {
  const isTopTen = row.variant === "top-ten";
  const sectionRef = useRef<HTMLElement>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [userPaused, setUserPaused] = useState(false);
  const [engaged, setEngaged] = useState(false); // pointer/focus/touch inside the row
  const tier = useMotionTier();
  const inView = useInView(sectionRef, { amount: 0.3 });
  // Stable keys need unique ids; a repeated title from the API would otherwise render twice and warn.
  const items = useMemo(() => { const seen = new Set<string>(); const unique = row.items.filter((t) => !seen.has(t.id) && Boolean(seen.add(t.id))); return isTopTen ? unique.slice(0, 10) : unique; }, [row.items, isTopTen]);
  const canLoop = loop && items.length >= MIN_ITEMS_TO_LOOP;
  const autoplayOn = Boolean(autoplayMs) && tier !== "none" && items.length > 1;

  useCarouselAutoplay({ api, intervalMs: autoplayOn ? autoplayMs : undefined, paused: userPaused || engaged || !inView });

  if (items.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      aria-label={row.title}
      className="group/rail relative z-0 mt-6 first:mt-0 sm:mt-8"
      onMouseEnter={() => setEngaged(true)}
      onMouseLeave={() => setEngaged(false)}
      onFocusCapture={() => setEngaged(true)}
      onBlurCapture={() => setEngaged(false)}
      onTouchStart={() => setEngaged(true)}
      onTouchEnd={() => setEngaged(false)}
    >
      <Reveal effect="slide" distance={12} duration={0.4} className={`mb-2 flex items-center justify-between gap-3 ${GUTTER}`}>
        <h2 className="text-lg font-medium text-white sm:text-[22px] sm:leading-7">{row.title}</h2>
        {autoplayOn && (
          <button type="button" onClick={() => setUserPaused((p) => !p)} aria-pressed={userPaused} aria-label={userPaused ? `Resume automatic sliding of ${row.title}` : `Pause automatic sliding of ${row.title}`}
            className="flex size-11 items-center justify-center rounded-full text-ws-text-2 transition-colors hover:bg-white/10 hover:text-white">
            {userPaused ? <Play className="size-4 fill-current" aria-hidden /> : <Pause className="size-4 fill-current" aria-hidden />}
          </button>
        )}
      </Reveal>
      {/* Snapping, group-wise paging; `duration` shapes Embla's settle into a soft, spring-like glide. */}
      <Carousel opts={{ align: "start", slidesToScroll: "auto", containScroll: "trimSnaps", dragFree: false, loop: canLoop, duration: 28 }} setApi={setApi} aria-label={`${row.title} carousel`}>
        <CarouselContent className="ml-0 pl-4 sm:pl-[58px]">
          {items.map((title, index) => (
            <CarouselItem key={`${row.title}-${title.id}`} className={`pl-0 pr-1 sm:pr-2 ${isTopTen ? BASIS_TOP_TEN : BASIS_STANDARD}`}>
              {/* Cards fade-and-scale in with a short stagger; the delay is capped so far-right cards never wait long. */}
              <Reveal effect="fade" duration={0.4} delay={Math.min(index, 6) * 0.04} amount={0.1}>
              {isTopTen ? <TopTenCard title={title} rank={index + 1} /> : row.variant === "continue-watching" ? <ContinueWatchingCard title={title} onRemove={onRemove} /> : <MediaCard title={title} />}
              </Reveal>
            </CarouselItem>
          ))}
          {/* Right padding on an overflowing flex container collapses, so Embla would end the row flush with the edge (clipping the last card). A zero-content end slice carries the gutter instead. */}
          <div aria-hidden className={`pointer-events-none shrink-0 grow-0 ${canLoop ? "hidden" : "basis-4 sm:basis-[58px]"}`} />
        </CarouselContent>
        <CarouselPrevious aria-label="Scroll left" className="left-0 top-0 z-20 hidden h-full w-[50px] rounded-none border-0 bg-black/50 p-0 text-white opacity-0 transition-opacity duration-200 hover:bg-black/70 disabled:hidden sm:flex group-hover/rail:opacity-100 focus-visible:opacity-100 motion-reduce:transition-none [&_svg]:size-8" />
        <CarouselNext aria-label="Scroll right" className="right-0 top-0 z-20 hidden h-full w-[50px] rounded-none border-0 bg-black/50 p-0 text-white opacity-0 transition-opacity duration-200 hover:bg-black/70 disabled:hidden sm:flex group-hover/rail:opacity-100 focus-visible:opacity-100 motion-reduce:transition-none [&_svg]:size-8" />
      </Carousel>
    </section>
  );
}
