"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { useMemo } from "react";
import { useMotionProfile } from "@/hooks/use-motion-profile";
import { EASINGS, revealStates, splitText, type Direction, type EasingName, type RevealEffect, type SplitMode } from "@/lib/scroll-motion";
import { cn } from "cn";

type Tag = "div" | "section" | "article" | "li" | "ul" | "p" | "span" | "h1" | "h2" | "h3";

export interface RevealOptionProps {
  effect?: RevealEffect;
  direction?: Direction;
  /** Seconds at full speed on a full-tier device. */
  duration?: number;
  delay?: number;
  easing?: EasingName;
  /** Travel in px for the `slide` effect (scaled down on phones and low-power devices). */
  distance?: number;
  /** Global tempo multiplier: 2 plays twice as fast. */
  speed?: number;
  /** `false` re-plays the effect (and reverses it) every time the element leaves/enters the viewport. */
  once?: boolean;
  /** Fraction of the element that must be visible to trigger. */
  amount?: number;
  /** IntersectionObserver rootMargin, e.g. "0px 0px -10% 0px" to trigger slightly late. */
  margin?: string;
}

type MotionOnly = "variants" | "initial" | "animate" | "whileInView" | "viewport" | "transition";
export type RevealProps = RevealOptionProps & Omit<HTMLMotionProps<"div">, MotionOnly> & { as?: Tag };

function useRevealVariants({ effect = "fade", direction = "up", duration = 0.6, delay = 0, easing = "out", distance = 32, speed = 1 }: RevealOptionProps) {
  const { tier, compact, duration: tierDuration } = useMotionProfile();
  return useMemo(() => {
    const { hidden, visible } = revealStates({ effect, direction, distance, tier, viewportWidth: compact ? 480 : 1280 });
    const transition = { duration: (duration * tierDuration) / Math.max(speed, 0.1), delay, ease: EASINGS[easing] };
    return { hidden: { ...hidden, transition: { ...transition, delay: 0 } }, visible: { ...visible, transition } };
  }, [effect, direction, duration, delay, easing, distance, speed, tier, compact, tierDuration]);
}

/**
 * Reveals its children when scrolled into view. Content is always in the DOM and readable by assistive tech;
 * the effect only changes how it paints in. Reduced-motion users see the content immediately.
 */
export function Reveal({ as = "div", effect, direction, duration, delay, easing, distance, speed, once = true, amount = 0.2, margin, className, children, ...rest }: RevealProps) {
  const variants = useRevealVariants({ effect, direction, duration, delay, easing, distance, speed });
  const Component = motion[as] as typeof motion.div;
  return (
    <Component data-reveal variants={variants} initial="hidden" whileInView="visible" viewport={{ once, amount, margin }} className={className} {...rest}>
      {children}
    </Component>
  );
}

export interface RevealGroupProps extends RevealOptionProps {
  /** Seconds between each child. Defaults to the device tier's step. */
  stagger?: number;
  as?: Tag;
  className?: string;
  children: React.ReactNode;
}

/** Container that staggers any `RevealItem` descendants. */
export function RevealGroup({ as = "div", stagger, delay = 0, once = true, amount = 0.15, margin, className, children }: RevealGroupProps) {
  const { stagger: tierStagger } = useMotionProfile();
  const Component = motion[as] as typeof motion.div;
  const step = stagger ?? tierStagger;
  const variants = useMemo(() => ({ hidden: {}, visible: { transition: { staggerChildren: step, delayChildren: delay } } }), [step, delay]);
  return <Component variants={variants} initial="hidden" whileInView="visible" viewport={{ once, amount, margin }} className={className}>{children}</Component>;
}

export function RevealItem({ as = "div", effect = "slide", direction, duration = 0.5, easing, distance = 24, speed, className, children, ...rest }: Omit<RevealProps, "delay" | "once" | "amount" | "margin">) {
  const variants = useRevealVariants({ effect, direction, duration, easing, distance, speed });
  const Component = motion[as] as typeof motion.div;
  return <Component data-reveal variants={variants} className={className} {...rest}>{children}</Component>;
}

/** Word-by-word or character-by-character reveal, with each unit sliding up out of a mask. */
export function TextReveal({ text, mode = "word", as = "p", stagger, delay = 0, once = true, className }: { text: string; mode?: SplitMode; as?: Tag; stagger?: number; delay?: number; once?: boolean; className?: string }) {
  const { tier, stagger: tierStagger } = useMotionProfile();
  const Component = motion[as] as typeof motion.div;
  const step = stagger ?? (mode === "char" ? tierStagger / 3 : tierStagger);
  const container = useMemo(() => ({ hidden: {}, visible: { transition: { staggerChildren: step, delayChildren: delay } } }), [step, delay]);
  const unit = useMemo(
    () => (tier === "none"
      ? { hidden: {}, visible: {} }
      : { hidden: { y: "110%", opacity: 0 }, visible: { y: "0%", opacity: 1, transition: { duration: 0.55, ease: EASINGS.out } } }),
    [tier],
  );
  const words = useMemo(() => splitText(text, "word"), [text]);
  return (
    <Component data-reveal-text variants={container} initial="hidden" whileInView="visible" viewport={{ once, amount: 0.4 }} className={className}>
      {/* Assistive tech reads one clean string; the split spans below are purely visual. */}
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {words.map((word, i) =>
          word.space ? (
            " "
          ) : (
            <span key={i} className="inline-block whitespace-nowrap align-bottom">
              {(mode === "char" ? splitText(word.value, "char") : [word]).map((part, j) => (
                <span key={j} className="inline-block overflow-hidden align-bottom">
                  <motion.span variants={unit} className="inline-block">{part.value}</motion.span>
                </span>
              ))}
            </span>
          ),
        )}
      </span>
    </Component>
  );
}

/** Image/poster reveal: a clip-path wipe with a slight counter-zoom. Pure paint work, no layout shift. */
export function ImageReveal({ children, className, duration = 0.9, delay = 0, once = true }: { children: React.ReactNode; className?: string; duration?: number; delay?: number; once?: boolean }) {
  const { tier } = useMotionProfile();
  const clip = useMemo(() => {
    if (tier === "none") return { hidden: {}, visible: {} };
    if (tier === "lite") return { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.4, delay } } };
    return {
      hidden: { clipPath: "inset(0 0 100% 0)" },
      visible: { clipPath: "inset(0 0 0% 0)", transition: { duration, delay, ease: EASINGS["in-out"] } },
    };
  }, [tier, duration, delay]);
  const zoom = useMemo(
    () => (tier === "full" ? { hidden: { scale: 1.2 }, visible: { scale: 1, transition: { duration: duration * 1.3, delay, ease: EASINGS.out } } } : { hidden: {}, visible: {} }),
    [tier, duration, delay],
  );
  return (
    <motion.div data-reveal variants={clip} initial="hidden" whileInView="visible" viewport={{ once, amount: 0.2 }} className={cn("overflow-hidden", className)}>
      <motion.div variants={zoom} className="h-full w-full">{children}</motion.div>
    </motion.div>
  );
}
