"use client";

import Image from "next/image";
import Link from "next/link";
import { useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

export interface MarqueeItem {
  title: string;
  caption?: string;
  href: string;
  image: string | null;
}

const DURATION = { fast: "25s", normal: "45s", slow: "80s" } as const;

interface InfiniteMovingCardsProps<T> {
  items: T[];
  getKey: (item: T) => string;
  /** `duplicate` is true for the second, looping copy: render it non-focusable (tabIndex -1) and let the wrapper hide it from assistive tech. */
  renderItem: (item: T, ctx: { duplicate: boolean }) => React.ReactNode;
  direction?: "left" | "right";
  speed?: keyof typeof DURATION;
  pauseOnHover?: boolean;
  /** External pause (a pause button, or an open hover preview). Hover and focus always pause as well. */
  paused?: boolean;
  /** Per-card width classes; every card uses the same width so the loop stays seamless. */
  itemClassName?: string;
  className?: string;
  label: string;
}

/**
 * Adapted from Aceternity's Infinite Moving Cards into a generic, structured-data marquee. The loop copy is rendered
 * by React rather than cloned DOM, and is aria-hidden so each title is announced once. The strip pauses on hover,
 * on keyboard focus and on request. Under reduced motion (or with too few items to loop) nothing moves and it is a
 * normal horizontally scrollable row. Content wider than the track is never clipped by the loop: overlays such as hover
 * previews must render in a portal.
 */
export function InfiniteMovingCards<T>({ items, getKey, renderItem, direction = "left", speed = "normal", pauseOnHover = true, paused = false, itemClassName = "w-[220px] sm:w-[280px]", className, label }: InfiniteMovingCardsProps<T>) {
  const reduced = useReducedMotion();
  if (items.length === 0) return null;
  const animate = !reduced && items.length > 2;
  const style = { "--animation-duration": DURATION[speed], "--animation-direction": direction === "left" ? "forwards" : "reverse" } as React.CSSProperties;

  return (
    <div role="region" aria-label={label} style={style} className={cn("group/marquee relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_4%,white_96%,transparent)]", !animate && "overflow-x-auto", className)}>
      <div
        // Inline, so it always beats the `animation` shorthand regardless of stylesheet order.
        style={paused ? { animationPlayState: "paused" } : undefined}
        className={cn(
          "flex w-max gap-3 py-2",
          animate && "animate-scroll",
          animate && pauseOnHover && "group-hover/marquee:[animation-play-state:paused] group-focus-within/marquee:[animation-play-state:paused]",
        )}
      >
        {[false, true].slice(0, animate ? 2 : 1).map((duplicate) => (
          <ul key={String(duplicate)} className="flex shrink-0 gap-3" aria-hidden={duplicate || undefined}>
            {items.map((item) => <li key={getKey(item)} className={cn("shrink-0", itemClassName)}>{renderItem(item, { duplicate })}</li>)}
          </ul>
        ))}
      </div>
    </div>
  );
}

/** Artwork link card used by the editorial strip. */
export function MarqueeLinkCard({ item, duplicate }: { item: MarqueeItem; duplicate: boolean }) {
  return (
    <Link href={item.href} tabIndex={duplicate ? -1 : undefined} className="group/card relative block aspect-video overflow-hidden rounded-xl border border-white/10 bg-ws-card outline-none transition-[border-color,box-shadow] duration-200 hover:border-ws-purple focus-visible:border-ws-blue focus-visible:ring-2 focus-visible:ring-ws-blue">
      {item.image && <Image src={item.image} alt="" fill sizes="(min-width: 640px) 280px, 220px" className="object-cover transition-transform duration-300 group-hover/card:scale-[1.03] motion-reduce:transition-none" />}
      <span className="absolute inset-0 bg-gradient-to-t from-ws-bg via-ws-bg/20 to-transparent" aria-hidden />
      <span className="absolute inset-x-3 bottom-2.5 flex flex-col">
        <span className="line-clamp-1 text-sm font-semibold text-ws-text">{item.title}</span>
        {item.caption && <span className="line-clamp-1 text-xs text-ws-text-2">{item.caption}</span>}
      </span>
    </Link>
  );
}
