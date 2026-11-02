"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { EASE } from "@/lib/motion";

/** Shared cinematic frame for every auth screen: glow backdrop, brand mark, animated card, safe-area padding. */
export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <main className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#0d1b3e] px-[max(1rem,env(safe-area-inset-left))] py-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(124,58,237,0.35),transparent_70%),radial-gradient(40%_40%_at_90%_100%,rgba(167,139,250,0.18),transparent_70%)]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-[#0d1b3e]/60 to-[#0d1b3e]" />
      <Link href="/" aria-label="WorldStreaming home" className="mb-6 text-2xl font-extrabold tracking-wide text-[#a78bfa] sm:absolute sm:top-6 sm:left-10 sm:mb-0">
        WORLD<span className="text-white">STREAMING</span>
      </Link>
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE.out }}
        className="w-full max-w-[26rem] rounded-xl border border-white/10 bg-black/60 p-6 text-white shadow-2xl backdrop-blur-md sm:p-9"
        aria-labelledby="auth-title"
      >
        <h1 id="auth-title" className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-zinc-300">{subtitle}</p>}
        <div className="mt-6">{children}</div>
        {footer && <div className="mt-6 text-sm text-zinc-300">{footer}</div>}
      </motion.section>
    </main>
  );
}

export const authLink = "text-white underline underline-offset-2 hover:text-[#a78bfa] focus-visible:rounded-sm";
