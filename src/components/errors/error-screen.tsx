"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MotionConfig, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { ArrowLeft, CircleHelp, Clapperboard, Compass, FileQuestion, House, LogIn, RefreshCw, Search, Tv } from "lucide-react";

import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { InteractiveHoverLink } from "@/components/ui/interactive-hover-button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ErrorBackground } from "./error-background";
import { ERROR_CONFIG, type ErrorVariant } from "./error-config";
import { ErrorSearch } from "./error-search";

const HELP_PHONE = { label: "0800 096 6379", href: "tel:08000966379" };

/** Destinations that exist today; nothing here is a recommendation, only a route. */
const DESTINATIONS = [
  { href: "/films", label: "Films", icon: Clapperboard },
  { href: "/series", label: "Series", icon: Tv },
  { href: "/new-popular", label: "New & Popular", icon: Compass },
] as const;

const touch = "h-12 min-h-12 w-full sm:w-auto sm:min-w-44";
const iconLift = "transition-transform duration-200 group-hover/button:-translate-x-0.5 motion-reduce:transition-none";

interface ErrorScreenProps {
  variant: ErrorVariant;
  /** Re-attempts the failed work. Required for the retryable variants to show a retry action. */
  onRetry?: () => void;
  /** Opaque server-log identifier (`error.digest`). Safe to show; it carries no internal detail. */
  reference?: string;
  /** Rendered inside `global-error`, where the router may be unusable: navigate with full page loads instead. */
  documentLevel?: boolean;
}

export function ErrorScreen({ variant, onRetry, reference, documentLevel = false }: ErrorScreenProps) {
  const config = ERROR_CONFIG[variant];
  const router = useRouter();
  const reduced = useReducedMotion();
  const [retrying, setRetrying] = useState(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(retryTimer.current), []);

  const go = (href: string) => (event: React.MouseEvent) => {
    if (!documentLevel) return;
    event.preventDefault();
    window.location.href = href;
  };

  function goBack() {
    // Only step back inside the site; otherwise (new tab, external referrer, no history) fall back to Home.
    let sameOrigin = false;
    try { sameOrigin = !!document.referrer && new URL(document.referrer).origin === window.location.origin; } catch { /* malformed referrer */ }
    if (window.history.length > 1 && sameOrigin) window.history.back();
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- global-error has no usable router
    else if (documentLevel) window.location.href = "/";
    else router.push("/");
  }

  function retry() {
    setRetrying(true);
    retryTimer.current = setTimeout(() => setRetrying(false), 1500);
    if (onRetry) onRetry();
    else window.location.reload();
  }

  // Pointer parallax on the numerals and ambient icons: fine pointers only, never under reduced motion.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 80, damping: 20 });
  const sy = useSpring(py, { stiffness: 80, damping: 20 });
  const codeX = useTransform(sx, (v) => v * 10);
  const codeY = useTransform(sy, (v) => v * 8);
  const iconX = useTransform(sx, (v) => v * -18);
  const iconY = useTransform(sy, (v) => v * -14);
  useEffect(() => {
    if (reduced || !window.matchMedia("(pointer: fine)").matches) return;
    const move = (event: PointerEvent) => {
      px.set(event.clientX / window.innerWidth - 0.5);
      py.set(event.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [reduced, px, py]);

  const HeroIcon = config.icon;
  const enter = (index: number) => ({ style: { animationDelay: `${120 + index * 80}ms` }, className: "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:fill-mode-backwards" });

  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider delay={200}>
        <main
          id="main-content"
          className="relative isolate flex min-h-dvh w-full flex-col items-center justify-center overflow-x-clip px-4 py-10 text-center text-white sm:px-8"
          style={{ paddingTop: "max(2.5rem, env(safe-area-inset-top))", paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))", paddingLeft: "max(1rem, env(safe-area-inset-left))", paddingRight: "max(1rem, env(safe-area-inset-right))" }}
        >
          <ErrorBackground />

          {/* Decorative ambient icons: hidden from assistive tech and from small screens to keep things clean. */}
          <motion.div aria-hidden style={{ x: iconX, y: iconY }} className="pointer-events-none absolute inset-0 -z-10 hidden md:block">
            <FloatingIcon icon={Clapperboard} className="top-[14%] left-[10%] text-ws-blue-light" delay={0} reduced={!!reduced} />
            <FloatingIcon icon={FileQuestion} className="top-[22%] right-[12%] text-ws-lavender" delay={1.2} reduced={!!reduced} />
            <FloatingIcon icon={Compass} className="bottom-[18%] left-[14%] text-ws-lavender" delay={2.1} reduced={!!reduced} />
            <FloatingIcon icon={Search} className="right-[10%] bottom-[24%] text-ws-blue-light" delay={0.6} reduced={!!reduced} />
          </motion.div>

          <Filmstrip reduced={!!reduced} />

          <Link href="/" prefetch={false} onClick={go("/")} className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-semibold tracking-wide text-ws-text outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-ws-blue-light">
            <Clapperboard aria-hidden className="size-5 text-ws-lavender" />
            {BRAND.name}
          </Link>

          <div className="flex w-full max-w-2xl flex-col items-center gap-5">
            <Tooltip>
              <TooltipTrigger
                type="button"
                aria-label={config.badge}
                className="group/badge inline-flex size-11 items-center justify-center rounded-full border border-ws-border bg-ws-card/80 text-ws-blue-light outline-none transition-colors hover:border-ws-purple-electric hover:text-ws-lavender focus-visible:ring-2 focus-visible:ring-ws-blue-light motion-reduce:transition-none"
              >
                <HeroIcon aria-hidden className="size-5 transition-transform duration-300 group-hover/badge:-rotate-6 group-hover/badge:scale-110 motion-reduce:transition-none" />
              </TooltipTrigger>
              <TooltipContent>{config.badge}</TooltipContent>
            </Tooltip>

            {config.code ? (
              <motion.div
                aria-hidden
                style={{ x: codeX, y: codeY }}
                initial={reduced ? false : { opacity: 0, scale: 0.82 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 140, damping: 14, mass: 0.9 }}
                className="relative select-none"
              >
                <div className="absolute inset-0 -z-10 scale-110 bg-gradient-to-r from-ws-blue to-ws-purple opacity-40 blur-3xl" />
                <motion.span
                  animate={reduced ? undefined : { y: [0, -8, 0] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                  className="glitch relative block"
                >
                  <GradientNumerals code={config.code} />
                </motion.span>
              </motion.div>
            ) : (
              <motion.div aria-hidden initial={reduced ? false : { opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 140, damping: 14 }} className="relative grid size-32 place-items-center rounded-full border border-ws-border bg-ws-card/60 sm:size-40">
                <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-ws-blue to-ws-purple opacity-40 blur-3xl" />
                <HeroIcon className="size-14 text-ws-lavender sm:size-20" strokeWidth={1.5} />
              </motion.div>
            )}

            <h1 {...enter(0)} className={cn("text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl", enter(0).className)}>
              {config.code && <span className="sr-only">{config.code} — </span>}
              {config.heading}
            </h1>
            <p {...enter(1)} className={cn("max-w-prose text-pretty text-base text-ws-text-2 sm:text-lg", enter(1).className)}>{config.description}</p>
            {reference && <p className="text-xs text-ws-text-2">Reference: <code className="font-mono text-ws-text">{reference}</code></p>}

            <div {...enter(2)} className={cn("mt-2 flex w-full flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center", enter(2).className)}>
              {config.signIn ? (
                <InteractiveHoverLink href="/account/sign-in" prefetch={false} onClick={go("/account/sign-in")} className={touch}>
                  <LogIn aria-hidden className="size-5" />Sign in
                </InteractiveHoverLink>
              ) : config.retryable ? (
                <Button onClick={retry} disabled={retrying} aria-busy={retrying} size="lg" className={cn(touch, "bg-ws-blue text-base font-semibold text-white hover:bg-ws-blue/90")}>
                  <RefreshCw aria-hidden className={cn("size-5", retrying && "animate-spin")} />{retrying ? "Retrying…" : "Try again"}
                </Button>
              ) : (
                <InteractiveHoverLink href="/" prefetch={false} onClick={go("/")} className={touch}>
                  <House aria-hidden className="size-5" />Back to Home
                </InteractiveHoverLink>
              )}

              {(config.signIn || config.retryable) && (
                <Button render={<Link href="/" prefetch={false} onClick={go("/")} />} nativeButton={false} variant="outline" size="lg" className={cn(touch, "border-ws-border bg-ws-card/70 text-base text-white hover:bg-ws-elevated")}>
                  <House aria-hidden className="size-5" />Back to Home
                </Button>
              )}

              <Button onClick={goBack} variant="outline" size="lg" className={cn(touch, "group/button border-ws-border bg-ws-card/70 text-base text-white hover:bg-ws-elevated")}>
                <ArrowLeft aria-hidden className={cn("size-5", iconLift)} />Go Back
              </Button>

              {config.search && (
                <Button render={<Link href="/films" prefetch={false} onClick={go("/films")} />} nativeButton={false} variant="premium" size="lg" className={cn(touch, "text-base font-semibold")}>
                  <Clapperboard aria-hidden className="size-5" />Explore Films
                </Button>
              )}
            </div>

            {config.search && (
              <div {...enter(3)} className={cn("mt-2 flex w-full flex-col items-center gap-5", enter(3).className)}>
                <ErrorSearch />
                <nav aria-label="Browse British Streaming" className="flex flex-wrap items-center justify-center gap-2">
                  <span className="text-sm text-ws-text-2">Or browse:</span>
                  {DESTINATIONS.map(({ href, label, icon: Icon }) => (
                    <Link key={href} href={href} prefetch={false} className="group/dest inline-flex min-h-11 items-center gap-2 rounded-full border border-ws-border bg-ws-card/70 px-4 text-sm font-medium text-white outline-none transition-colors hover:border-ws-purple-electric hover:bg-ws-elevated focus-visible:ring-2 focus-visible:ring-ws-blue-light motion-reduce:transition-none">
                      <Icon aria-hidden className="size-4 text-ws-lavender transition-transform duration-200 group-hover/dest:scale-110 motion-reduce:transition-none" />{label}
                    </Link>
                  ))}
                </nav>
              </div>
            )}

            <Tooltip>
              <TooltipTrigger
                render={<a href={HELP_PHONE.href} />}
                className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm text-ws-text outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-ws-blue-light motion-reduce:transition-none"
              >
                <CircleHelp aria-hidden className="size-4 text-ws-lavender" />
                Need help? Call {HELP_PHONE.label}
              </TooltipTrigger>
              <TooltipContent>Speak to our support team</TooltipContent>
            </Tooltip>
          </div>
        </main>
      </TooltipProvider>
    </MotionConfig>
  );
}

function GradientNumerals({ code }: { code: string }) {
  const base = "bg-[linear-gradient(90deg,#60A5FA,#8B5CF6,#2563EB,#60A5FA)] bg-[length:200%_100%] bg-clip-text text-transparent motion-safe:animate-[gradient-pan_8s_linear_infinite]";
  return (
    <span className="relative inline-block font-heading text-[clamp(6rem,28vw,15rem)] leading-none font-black tracking-tighter">
      <span className={base}>{code}</span>
      {/* Optional glitch: two offset copies that only appear on hover/focus-within, one short burst, motion-safe only. */}
      <span aria-hidden className="pointer-events-none absolute inset-0 glitch-a hidden text-ws-blue-light/70 mix-blend-screen">{code}</span>
      <span aria-hidden className="pointer-events-none absolute inset-0 glitch-b hidden text-ws-purple-electric/70 mix-blend-screen">{code}</span>
    </span>
  );
}

function FloatingIcon({ icon: Icon, className, delay, reduced }: { icon: React.ElementType; className: string; delay: number; reduced: boolean }) {
  return (
    <motion.span
      className={cn("absolute opacity-40", className)}
      animate={reduced ? undefined : { y: [0, -10, 0], rotate: [-4, 4, -4] }}
      transition={{ duration: 8, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      <Icon className="size-9 lg:size-12" strokeWidth={1.25} />
    </motion.span>
  );
}

/** Slim decorative filmstrip along the bottom edge; sprocket holes drift slowly, and stand still when motion is reduced. */
function Filmstrip({ reduced }: { reduced: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-6 overflow-hidden opacity-40" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <motion.div
        className="flex h-full w-[200%] gap-3 border-y border-ws-border bg-ws-card/60 px-2 py-1.5"
        animate={reduced ? undefined : { x: ["0%", "-50%"] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        {Array.from({ length: 80 }, (_, index) => <span key={index} className="h-full w-4 shrink-0 rounded-[2px] bg-ws-bg" />)}
      </motion.div>
    </div>
  );
}
