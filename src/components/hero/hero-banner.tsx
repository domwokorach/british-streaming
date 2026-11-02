"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, CircleHelp, Pause, Play } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { TitleDetailsModal } from "@/components/title/title-details-modal";
import { MediaMetadata } from "@/components/content/media-metadata";
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
    const observer = el ? new IntersectionObserver(([entry]) => setTabHidden(document.hidden || !entry.isIntersecting), { threshold: 0.25 }) : null;
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
      className="px-4 pt-[calc(78px+env(safe-area-inset-top))] sm:px-8"
    >
      <div className="relative h-[68vh] min-h-[480px] max-h-[640px] overflow-hidden rounded-xl">
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
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d1b3e] via-[#0d1b3e]/60 via-40% to-transparent md:bg-gradient-to-r md:from-[#0d1b3e] md:via-[#0d1b3e]/70 md:via-35% md:to-transparent md:to-70%" />
            <motion.div style={{ opacity: copyOpacity, y: copyY }} className="absolute inset-x-5 bottom-14 z-10 flex flex-col justify-end sm:inset-x-auto sm:inset-y-0 sm:left-12 sm:max-w-md sm:justify-center sm:pb-6">
              <p className="mb-2 text-base font-semibold text-[#a78bfa] sm:text-lg">
                {title.kind === "series" ? "New series - stream it now" : "Featured film - stream it now"}
              </p>
              <h1 className="mb-3 text-balance text-3xl leading-[0.98] font-extrabold tracking-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl">{title.name}</h1>
              <p className="mb-4 line-clamp-3 max-w-md text-sm leading-6 text-white sm:line-clamp-4 sm:text-[15px]">{description}</p>
              <div className="mb-5 sm:mb-6"><MediaMetadata title={title} /></div>
              <div className="flex gap-2">
                <Button onClick={() => playMedia(title)} size="lg" className="h-11 flex-1 rounded-[4px] bg-[#7c3aed] px-6 font-bold uppercase tracking-wider text-white transition-transform duration-150 hover:scale-[1.02] hover:bg-[#7c3aed]/85 active:scale-[0.97] sm:flex-none">
                  <Play className="size-5 fill-current" /> Play
                </Button>
                <TitleDetailsModal
                  title={title}
                  renderTrigger={<Button size="lg" className="h-11 flex-1 rounded-[4px] border border-white/70 bg-transparent px-5 font-bold uppercase tracking-wider text-white transition-transform duration-150 hover:scale-[1.02] hover:bg-white/10 active:scale-[0.97] sm:flex-none" />}
                >
                  <CircleHelp className="size-5" /> More Info
                </TitleDetailsModal>
              </div>
            </motion.div>
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
