"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export interface HoverEffectItem {
  title: string;
  description: string;
  link: string;
}

/**
 * Adapted from Aceternity's Card Hover Effect: a shared highlight slides between cards (one `layoutId`, so there is
 * a single animated element and no competing transforms). It follows pointer hover AND keyboard focus, so it is not
 * pointer-only, and uses Next <Link>s with the British Streaming blue/purple accent.
 */
export function HoverEffect({ items, className, label }: { items: HoverEffectItem[]; className?: string; label?: string }) {
  const [active, setActive] = useState<number | null>(null);
  return (
    <ul aria-label={label} className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {items.map((item, idx) => (
        <li key={item.link} className="relative">
          <Link
            href={item.link}
            className="group relative block h-full w-full rounded-3xl p-2 outline-none"
            onMouseEnter={() => setActive(idx)}
            onMouseLeave={() => setActive(null)}
            onFocus={(e) => e.currentTarget.matches(":focus-visible") && setActive(idx)}
            onBlur={() => setActive(null)}
          >
            <AnimatePresence>
              {active === idx && (
                <motion.span
                  aria-hidden
                  className="absolute inset-0 block size-full rounded-3xl bg-gradient-to-br from-ws-blue/25 to-ws-purple/25 ring-1 ring-ws-purple/50"
                  layoutId={`hover-bg-${label ?? "grid"}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.15 } }}
                  exit={{ opacity: 0, transition: { duration: 0.15, delay: 0.1 } }}
                />
              )}
            </AnimatePresence>
            <Card>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("relative z-20 size-full overflow-hidden rounded-2xl border border-ws-border bg-ws-card p-4 transition-colors group-hover:border-ws-purple/60 group-focus-visible:border-ws-blue", className)}>
      <div className="relative z-50 p-2">{children}</div>
    </div>
  );
}

export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h3 className={cn("text-lg font-bold tracking-wide text-ws-text", className)}>{children}</h3>;
}

export function CardDescription({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={cn("mt-3 text-sm leading-relaxed tracking-wide text-ws-text-2", className)}>{children}</p>;
}
