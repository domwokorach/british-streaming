"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { BRAND } from "@/lib/brand";
import { ShineBorder } from "@/components/ui/shine-border";
import { WavyCanvas } from "@/components/ui/wavy-background";
import { EASE } from "@/lib/motion";

/** Blue-to-purple border; the single decorative border instance for every auth screen. */
const SHINE = ["var(--ws-blue)", "var(--ws-purple-electric)", "var(--ws-lavender)"];

/** Shared cinematic frame for every auth screen: glow backdrop, brand mark, animated card, safe-area padding. */
export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <main className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-ws-bg px-[max(1rem,env(safe-area-inset-left))] py-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <WavyCanvas className="-z-20" backgroundFill="#101116" waveOpacity={0.4} speed="slow" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(37,99,235,0.30),transparent_70%),radial-gradient(40%_40%_at_90%_100%,rgba(124,58,237,0.22),transparent_70%)]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-ws-bg/60 to-ws-bg" />
      <Link href="/" aria-label={`${BRAND.name} home`} className="mb-6 whitespace-nowrap text-xl font-extrabold tracking-wide min-[400px]:text-2xl bg-gradient-to-r from-ws-blue-light to-ws-lavender bg-clip-text text-transparent sm:absolute sm:top-6 sm:left-10 sm:mb-0">
        {BRAND.name}
      </Link>
      <motion.section
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: EASE.out }}
        className="relative w-full max-w-[26rem] rounded-xl border border-white/10 bg-ws-card/85 p-6 text-white shadow-[0_20px_60px_-15px_rgba(124,58,237,0.35)] backdrop-blur-md sm:rounded-2xl sm:p-9"
        aria-labelledby="auth-title"
      >
        <ShineBorder aria-hidden shineColor={SHINE} borderWidth={2} duration={10} className="opacity-70 sm:opacity-100" />
        <h1 id="auth-title" className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-ws-text">{subtitle}</p>}
        <div className="mt-6">{children}</div>
        {footer && <div className="mt-6 text-sm text-ws-text">{footer}</div>}
      </motion.section>
      <footer className="mt-6 flex flex-col items-center gap-2 text-xs text-ws-text-2 sm:absolute sm:bottom-5 sm:mt-0">
        <nav aria-label="Legal and accessibility" className="flex flex-wrap justify-center gap-x-4">
          <Link href="/privacy" className="inline-flex min-h-8 items-center hover:text-white hover:underline">Privacy</Link>
          <Link href="/legal/terms-and-conditions" className="inline-flex min-h-8 items-center hover:text-white hover:underline">Terms &amp; Conditions</Link>
          <Link href="/accessibility" className="inline-flex min-h-8 items-center hover:text-white hover:underline">Accessibility</Link>
        </nav>
        <p>&copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
      </footer>
    </main>
  );
}

export const authLink = "text-white underline underline-offset-2 hover:text-ws-lavender focus-visible:rounded-sm";
