"use client";

import { NavLink } from "@/components/layout/nav-link";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";
import { useRef, useState } from "react";

import { useHasHover } from "@/hooks/use-has-hover";
import { cn } from "@/lib/utils";

export interface DockItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  active?: boolean;
}

const BASE = 44; // also the minimum touch target
const PEAK = 64;
const SPRING = { mass: 0.1, stiffness: 150, damping: 12 };

/**
 * Adapted from Aceternity's Floating Dock. One always-visible row at every size (no hidden collapsed menu),
 * real <Link>s with an active state and accessible names. Cursor magnification is enabled only for fine pointers
 * without reduced-motion, so touch users get a plain, stable row of 44px targets.
 */
export function FloatingDock({ items, className, label = "Dock navigation" }: { items: DockItem[]; className?: string; label?: string }) {
  const mouseX = useMotionValue(Infinity);
  const hasHover = useHasHover();
  const reduced = useReducedMotion();
  const magnify = hasHover && !reduced;
  return (
    <motion.nav
      aria-label={label}
      onMouseMove={magnify ? (e) => mouseX.set(e.clientX) : undefined}
      onMouseLeave={magnify ? () => mouseX.set(Infinity) : undefined}
      className={cn("flex items-end gap-1 rounded-2xl border border-white/10 bg-ws-card/90 p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:gap-2", className)}
    >
      {items.map((item) => <DockIcon key={item.href} mouseX={mouseX} magnify={magnify} {...item} />)}
    </motion.nav>
  );
}

function DockIcon({ mouseX, magnify, title, href, icon, active }: DockItem & { mouseX: MotionValue<number>; magnify: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [tip, setTip] = useState(false);
  const distance = useTransform(mouseX, (x) => { const b = ref.current?.getBoundingClientRect(); return b ? x - b.x - b.width / 2 : Infinity; });
  const size = useSpring(useTransform(distance, [-120, 0, 120], [BASE, PEAK, BASE]), SPRING);

  return (
    <NavLink
      ref={ref}
      href={href}
      aria-label={title}
      aria-current={active ? "page" : undefined}
      onMouseEnter={() => setTip(true)}
      onMouseLeave={() => setTip(false)}
      onFocus={() => setTip(true)}
      onBlur={() => setTip(false)}
      className="relative outline-none"
    >
      <motion.span
        style={magnify ? { width: size, height: size } : { width: BASE, height: BASE }}
        className={cn("flex items-center justify-center rounded-full transition-colors focus-visible:ring-2", active ? "bg-gradient-to-br from-ws-blue to-ws-purple text-white shadow-[0_0_16px_rgba(124,58,237,0.5)]" : "bg-ws-elevated text-ws-text-2 hover:text-white")}
      >
        <span className="flex size-5 items-center justify-center [&_svg]:size-full" aria-hidden>{icon}</span>
      </motion.span>
      <AnimatePresence>
        {tip && (
          <motion.span role="presentation" initial={{ opacity: 0, y: 6, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: 2, x: "-50%" }} transition={{ duration: 0.12 }}
            className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden rounded-md border border-white/10 bg-ws-elevated px-2 py-0.5 text-xs whitespace-nowrap text-ws-text sm:block">
            {title}
          </motion.span>
        )}
      </AnimatePresence>
    </NavLink>
  );
}
