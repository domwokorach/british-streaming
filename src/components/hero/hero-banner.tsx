"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Info, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { TitleDetailsModal } from "@/components/title/title-details-modal";
import { HoverPreview } from "@/components/content/hover-preview";
import { useHasHover } from "@/hooks/use-has-hover";
import { useTrailerKey } from "@/hooks/use-trailer-key";
import { parseCompositeId } from "@/lib/tmdb-id";
import { formatRuntime } from "@/components/content/media-metadata";
import { useMotionProfile } from "@/hooks/use-motion-profile";
import { EASE } from "@/lib/motion";
import type { FeaturedTitle } from "@/lib/types";
import { cn } from "cn";
import { usePlayback } from "@/providers/playback-provider";

/** Time each slide stays on screen before auto-advancing. */
const AUTOPLAY_MS = 8000;
const SWIPE_THRESHOLD_PX = 60;

export function HeroBanner({ slides, autoplayMs = AUTOPLAY_MS }: { slides: FeaturedTitle[]; autoplayMs?: number }) {
  const { playMedia } = usePlayback();
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const count = slides.length;
  const playing = count > 1 && !reduceMotion && !userPaused && !interacting && !tabHidden;
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(true);
  const [muted, setMuted] = useState(true);
  const [readyFor, setReadyFor] = useState<string | null>(null);
  const hasHover = useHasHover();

  // Scroll-linked depth: the backdrop drifts and zooms slowly while the copy fades and lifts away.
  // Everything is a transform/opacity MotionValue, so scrolling never re-renders React. Zero on reduced-motion/low-power.
  const { parallax } = useMotionProfile();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 18 * parallax]);
  const bgScale = useTransform(scrollYProgress, [0, 1], parallax ? [1.08, 1.08 + 0.08 * parallax] : [1, 1]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.55], [1, parallax ? 0.1 : 1]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -50 * parallax]);

  const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

  // Auto-advance; restarting on every index change also resets the progress bar.
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => setIndex((current) => (current + 1) % count), autoplayMs);
    return () => window.clearTimeout(timer);
  }, [playing, index, count, autoplayMs]);

  // Pause while the tab is hidden or the hero is scrolled out of view.
  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    const el = sectionRef.current;
    const observer = el ? new IntersectionObserver(([entry]) => { setTabHidden(document.hidden || !entry.isIntersecting); setInView(entry.isIntersecting); }, { threshold: 0.25 }) : null;
    if (el && observer) observer.observe(el);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      observer?.disconnect();
    };
  }, []);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowLeft") go(index - 1);
    else if (event.key === "ArrowRight") go(index + 1);
  };

  const { title, description } = slides[index];
  const parsed = parseCompositeId(title.id);
  // Muted preview only on pointer devices, never with reduced motion or Save-Data, and only while the hero is on screen.
  const saveData = typeof navigator !== "undefined" && Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
  const previewAllowed = hasHover && !reduceMotion && !saveData && inView && !tabHidden;
  const trailerKey = useTrailerKey(parsed?.mediaType ?? null, parsed?.tmdbId ?? null, previewAllowed);
  // Hold the still poster for a moment so the video never competes with first paint.
  useEffect(() => {
    if (!previewAllowed) return;
    const timer = window.setTimeout(() => setReadyFor(title.id), 1800);
    return () => window.clearTimeout(timer);
  }, [title.id, previewAllowed]);
  const trailerReady = previewAllowed && readyFor === title.id;
  const meta = [title.kind === "series" ? "Series" : "Film", title.genres[0], title.year ? String(title.year) : null, title.kind === "movie" && title.runtimeMinutes ? formatRuntime(title.runtimeMinutes) : title.seasons ? `${title.seasons} Season${title.seasons === 1 ? "" : "s"}` : null].filter(Boolean) as string[];
  const isNew = title.year === new Date().getFullYear();

  return (
    <section
      ref={sectionRef}
      aria-roledescription="carousel"
      aria-label="Featured titles"
      onKeyDown={onKeyDown}
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={() => setInteracting(false)}
      onTouchStart={() => setInteracting(true)}
      onTouchEnd={() => setInteracting(false)}
      className="px-0 pt-[calc(64px+env(safe-area-inset-top))] sm:px-[58px] sm:pt-[calc(72px+env(safe-area-inset-top))]"
    >
      <div className="relative h-[64vh] min-h-[440px] max-h-[700px] overflow-hidden bg-ws-bg sm:rounded-[24px]">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={title.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${count}`}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: EASE.out }}
            drag={count > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -SWIPE_THRESHOLD_PX) go(index + 1);
              else if (info.offset.x > SWIPE_THRESHOLD_PX) go(index - 1);
            }}
            className="absolute inset-0 touch-pan-y"
          >
            {title.backdropUrl && (
              <motion.div style={{ y: bgY, scale: bgScale }} className="absolute inset-0 will-change-transform">
              <Image src={title.backdropUrl} alt="" fill priority={index === 0} sizes="(min-width: 1920px) 1840px, 100vw" draggable={false} className="object-cover object-[65%_center] md:object-[58%_center]" />
              </motion.div>
            )}
            {trailerReady && trailerKey && (
              <div className="absolute inset-0 hidden md:block">
                <HoverPreview trailerKey={trailerKey} title={title.name} muted={muted} />
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ws-bg via-ws-bg/40 via-30% to-transparent md:bg-gradient-to-r md:from-ws-bg/95 md:via-ws-bg/50 md:via-40% md:to-transparent md:to-70%" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_70%_at_0%_100%,rgba(124,58,237,0.22),transparent_70%),radial-gradient(40%_50%_at_100%_0%,rgba(37,99,235,0.14),transparent_70%)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ws-bg to-transparent" />
            <motion.div style={{ opacity: copyOpacity, y: copyY }} className="absolute inset-x-5 bottom-12 z-10 flex flex-col justify-end sm:inset-x-auto sm:bottom-14 sm:left-10 sm:max-w-[640px]">
              {title.logoUrl ? (
                <div className="relative mb-4 h-20 w-3/4 max-w-[520px] sm:h-32"><Image src={title.logoUrl} alt={title.name} fill sizes="520px" className="object-contain object-left-bottom drop-shadow-lg" /></div>
              ) : (
                <h1 className="mb-3 text-balance text-4xl font-black uppercase leading-[0.95] tracking-[-0.03em] text-white drop-shadow-lg sm:text-6xl lg:text-7xl">{title.name}</h1>
              )}
              <p className="mb-3 flex flex-wrap items-center gap-x-2 text-sm font-semibold text-white">
                {meta.map((part, i) => <span key={part} className="flex items-center gap-2">{i > 0 && <span aria-hidden className="text-ws-text-2">•</span>}{part}</span>)}
                {title.certification && <span className="ml-1 rounded-full bg-ws-purple-electric px-2 py-px text-[11px] font-bold">{title.certification}</span>}
              </p>
              <p className="mb-5 line-clamp-3 max-w-[620px] text-sm leading-6 text-white sm:text-lg sm:leading-7">{description}</p>
              <div className="flex gap-3">
                <Button onClick={() => playMedia(title)} size="lg" className="h-12 min-w-[108px] rounded-full bg-white px-6 text-base font-semibold text-black transition-[transform,background-color] duration-150 hover:bg-white/85 active:scale-[0.97]">
                  <Play className="size-5 fill-current" /> Play
                </Button>
                <TitleDetailsModal
                  title={title}
                  renderTrigger={<Button size="lg" className="h-12 rounded-full bg-ws-elevated/90 px-6 text-base font-semibold text-white transition-[transform,background-color] duration-150 hover:bg-ws-elevated active:scale-[0.97]" />}
                >
                  <Info className="size-5" /> More Info
                </TitleDetailsModal>
              </div>
            </motion.div>
            <div className="absolute bottom-14 right-0 z-10 flex items-center gap-3">
              {trailerReady && trailerKey && (
                <button type="button" aria-label={muted ? "Unmute preview" : "Mute preview"} aria-pressed={!muted} onClick={() => setMuted((m) => !m)} className="hidden size-11 items-center justify-center rounded-full border border-white/60 bg-black/40 text-white transition-colors hover:border-white hover:bg-white/10 md:flex">
                  {muted ? <VolumeX className="size-5" aria-hidden /> : <Volume2 className="size-5" aria-hidden />}
                </button>
              )}
              {isNew && <span className="hidden h-8 sm:flex items-center border-l-[3px] border-ws-purple-electric bg-ws-bg/70 pl-3 pr-5 text-sm font-semibold text-white">Recently added</span>}
            </div>
          </motion.div>
        </AnimatePresence>

        {count > 1 && (
          <>
            <button type="button" aria-label="Previous slide" onClick={() => go(index - 1)} className="absolute top-1/2 left-2 z-20 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/70 md:flex"><ChevronLeft className="size-6" /></button>
            <button type="button" aria-label="Next slide" onClick={() => go(index + 1)} className="absolute top-1/2 right-2 z-20 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/70 md:flex"><ChevronRight className="size-6" /></button>
            <div className="absolute inset-x-5 bottom-4 z-20 flex items-center gap-3 sm:inset-x-12">
              <div className="flex flex-1 gap-1.5 sm:max-w-xs" role="tablist" aria-label="Choose slide">
                {slides.map((slide, i) => (
                  <button key={slide.title.id} type="button" role="tab" aria-selected={i === index} aria-label={`Go to slide ${i + 1}: ${slide.title.name}`} onClick={() => go(i)} className="group/dot flex h-6 flex-1 items-center">
                    <span className="relative block h-1 w-full overflow-hidden rounded-full bg-white/30 group-hover/dot:bg-white/50">
                      {i < index || (i === index && !playing && (reduceMotion || userPaused || count === 1)) ? <span className="absolute inset-0 bg-white" /> : null}
                      {i === index && !(reduceMotion || userPaused) && (
                        <span key={`${index}-${playing}`} className={cn("absolute inset-y-0 left-0 bg-white", playing ? "animate-[hero-progress_var(--hero-ms)_linear_forwards]" : "w-full")} style={{ ["--hero-ms" as string]: `${autoplayMs}ms` }} />
                      )}
                    </span>
                  </button>
                ))}
              </div>
              {!reduceMotion && (
                <button type="button" aria-label={userPaused ? "Resume auto-play" : "Pause auto-play"} onClick={() => setUserPaused((p) => !p)} className="flex size-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/70">
                  {userPaused ? <Play className="size-4 fill-current" /> : <Pause className="size-4 fill-current" />}
                </button>
              )}
            </div>
          </>
        )}
        <p className="sr-only" aria-live={playing ? "off" : "polite"}>{title.name}</p>
      </div>
    </section>
  );
}
