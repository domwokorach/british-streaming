"use client";

import { Pause, Play } from "lucide-react";
import { useInView } from "motion/react";
import { useRef, useState } from "react";
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

export function ContentRow({ row, onRemove, autoplayMs, loop = false }: ContentRowProps) {
  const isTopTen = row.variant === "top-ten";
  const sectionRef = useRef<HTMLElement>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [userPaused, setUserPaused] = useState(false);
  const [engaged, setEngaged] = useState(false); // pointer/focus/touch inside the row
  const tier = useMotionTier();
  const inView = useInView(sectionRef, { amount: 0.3 });
  const canLoop = loop && row.items.length >= MIN_ITEMS_TO_LOOP;
  const autoplayOn = Boolean(autoplayMs) && tier !== "none" && row.items.length > 1;

  useCarouselAutoplay({ api, intervalMs: autoplayOn ? autoplayMs : undefined, paused: userPaused || engaged || !inView });

  return (
    <section
      ref={sectionRef}
      className="group/rail relative z-0 mt-8 first:mt-0 hover:z-30 focus-within:z-30 sm:mt-12"
      onMouseEnter={() => setEngaged(true)}
      onMouseLeave={() => setEngaged(false)}
      onFocusCapture={() => setEngaged(true)}
      onBlurCapture={() => setEngaged(false)}
      onTouchStart={() => setEngaged(true)}
      onTouchEnd={() => setEngaged(false)}
    >
      <Reveal effect="slide" distance={20} duration={0.5} className="mb-4 flex items-center justify-between gap-3 px-4 sm:px-8">
        <h2 className="text-xl font-semibold text-white sm:text-2xl">{row.title}</h2>
        <span className="flex items-center gap-3">
          {autoplayOn && (
            <button type="button" onClick={() => setUserPaused((p) => !p)} aria-pressed={userPaused} aria-label={userPaused ? `Resume automatic sliding of ${row.title}` : `Pause automatic sliding of ${row.title}`}
              className="flex size-9 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-[#a78bfa]">
              {userPaused ? <Play className="size-4 fill-current" aria-hidden /> : <Pause className="size-4 fill-current" aria-hidden />}
            </button>
          )}
          <span className="text-base font-medium text-[#a78bfa]">View All</span>
        </span>
      </Reveal>
      {/* Snapping, group-wise paging; `duration` shapes Embla's settle into a soft, spring-like glide. */}
      <Carousel opts={{ align: "start", slidesToScroll: "auto", containScroll: "trimSnaps", dragFree: false, loop: canLoop, duration: 28 }} setApi={setApi} aria-label={`${row.title} carousel`} className="px-4 sm:px-8">
        <CarouselContent className="-ml-2 sm:-ml-3">
          {row.items.map((title, index) => (
            <CarouselItem key={`${row.title}-${title.id}`} className={`pl-2 sm:pl-3 ${isTopTen ? "basis-[65%] sm:basis-[31%] lg:basis-[23%]" : "basis-[42%] sm:basis-[28%] lg:basis-[16.6%]"}`}>
              {/* Cards fade-and-scale in with a short stagger; the delay is capped so far-right cards never wait long. */}
              <Reveal effect="zoom-in" duration={0.45} delay={Math.min(index, 6) * 0.05} amount={0.1}>
              {isTopTen ? <TopTenCard title={title} rank={index + 1} /> : row.variant === "continue-watching" ? <ContinueWatchingCard title={title} onRemove={onRemove} /> : <MediaCard title={title} />}
              </Reveal>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2 z-30 hidden h-12 w-12 rounded-full border-0 bg-transparent text-white opacity-0 transition-[opacity,transform] duration-200 ease-out hover:scale-105 hover:bg-white/10 disabled:hidden sm:flex group-hover/rail:opacity-100 focus-visible:opacity-100" />
        <CarouselNext className="right-2 z-30 hidden h-12 w-12 rounded-full border-0 bg-transparent text-white opacity-0 transition-[opacity,transform] duration-200 ease-out hover:scale-105 hover:bg-white/10 disabled:hidden sm:flex group-hover/rail:opacity-100 focus-visible:opacity-100" />
      </Carousel>
    </section>
  );
}
