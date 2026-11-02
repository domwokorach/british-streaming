"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import { useId, useRef, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { MotionTierOverride } from "@/hooks/use-motion-profile";
import { DIRECTIONS, EASING_NAMES, REVEAL_EFFECTS, type Direction, type EasingName, type RevealEffect } from "@/lib/scroll-motion";
import { Counter } from "./counter";
import { ParallaxLayer } from "./parallax";
import { ImageReveal, Reveal, RevealGroup, RevealItem, TextReveal } from "./reveal";

interface Settings {
  effect: RevealEffect;
  direction: Direction;
  duration: number;
  delay: number;
  easing: EasingName;
  amount: number;
  repeat: boolean;
  intensity: number;
  speed: number;
  stiffness: number;
  damping: number;
  mass: number;
  reducedMotion: boolean;
}

const DEFAULTS: Settings = { effect: "slide", direction: "up", duration: 0.7, delay: 0, easing: "out", amount: 0.3, repeat: false, intensity: 1, speed: 1, stiffness: 180, damping: 22, mass: 1, reducedMotion: false };

const CARD = "flex h-40 items-center justify-center rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#1f3170] text-lg font-semibold text-white shadow-lg";

export function ScrollLab() {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [runId, setRunId] = useState(0);
  const [paused, setPaused] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const set = <K extends keyof Settings>(key: K) => (value: Settings[K]) => setS((prev) => ({ ...prev, [key]: value }));

  const reset = () => { scroller.current?.scrollTo({ top: 0 }); setRunId((n) => n + 1); };
  const replay = () => { setPaused(false); reset(); };

  const reveal = { effect: s.effect, direction: s.direction, duration: s.duration, delay: s.delay, easing: s.easing, amount: s.amount, once: !s.repeat, speed: s.speed };

  return (
    <main className="min-h-dvh bg-[#0d1b3e] pb-16 text-white">
      <Navbar />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 pt-24 sm:px-8 lg:grid-cols-[22rem_1fr]">
        <aside aria-label="Animation controls" className="space-y-4 rounded-xl border border-white/10 bg-[#16275a]/60 p-4 lg:sticky lg:top-24 lg:self-start">
          <h1 className="text-xl font-bold">Scroll animation lab</h1>
          <Select label="Animation type" value={s.effect} options={REVEAL_EFFECTS} onChange={set("effect")} />
          <Select label="Direction (slide)" value={s.direction} options={DIRECTIONS} onChange={set("direction")} disabled={s.effect !== "slide"} />
          <Select label="Easing" value={s.easing} options={EASING_NAMES} onChange={set("easing")} />
          <Range label="Duration" unit="s" min={0.1} max={2} step={0.05} value={s.duration} onChange={set("duration")} />
          <Range label="Delay" unit="s" min={0} max={1.5} step={0.05} value={s.delay} onChange={set("delay")} />
          <Range label="Trigger threshold" unit="" min={0.05} max={1} step={0.05} value={s.amount} onChange={set("amount")} />
          <Range label="Animation speed" unit="×" min={0.25} max={3} step={0.25} value={s.speed} onChange={set("speed")} />
          <Range label="Parallax intensity" unit="×" min={0} max={2} step={0.1} value={s.intensity} onChange={set("intensity")} />
          <Range label="Spring stiffness" unit="" min={20} max={600} step={10} value={s.stiffness} onChange={set("stiffness")} />
          <Range label="Spring damping" unit="" min={2} max={60} step={1} value={s.damping} onChange={set("damping")} />
          <Range label="Spring mass" unit="" min={0.2} max={4} step={0.1} value={s.mass} onChange={set("mass")} />
          <Toggle label="Repeat on every scroll" checked={s.repeat} onChange={set("repeat")} />
          <Toggle label="Reduced-motion preview" checked={s.reducedMotion} onChange={set("reducedMotion")} />
          <div className="flex gap-2">
            <button type="button" onClick={replay} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-[#7c3aed] text-sm font-semibold"><Play className="size-4" aria-hidden /> Play</button>
            <button type="button" onClick={() => setPaused((p) => !p)} aria-pressed={paused} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-white/25 text-sm font-semibold"><Pause className="size-4" aria-hidden /> {paused ? "Resume" : "Pause"}</button>
            <button type="button" onClick={reset} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-white/25 text-sm font-semibold"><RotateCcw className="size-4" aria-hidden /> Reset</button>
          </div>
          <pre className="overflow-x-auto rounded-md bg-black/40 p-3 text-xs leading-5 text-zinc-300">{`<Reveal effect="${s.effect}"${s.effect === "slide" ? ` direction="${s.direction}"` : ""}\n  duration={${s.duration}} delay={${s.delay}}\n  easing="${s.easing}" amount={${s.amount}}\n  speed={${s.speed}} once={${!s.repeat}} />\n\ntransition={{ type: "spring",\n  stiffness: ${s.stiffness}, damping: ${s.damping}, mass: ${s.mass} }}`}</pre>
        </aside>

        <MotionTierOverride tier={s.reducedMotion ? "none" : null}>
          <div ref={scroller} tabIndex={0} aria-label="Animation preview. Scroll inside to trigger animations." key={runId} className={`h-[calc(100dvh-8rem)] space-y-16 rounded-xl border border-white/10 p-4 sm:p-8 ${paused ? "overflow-hidden" : "overflow-y-auto"}`}>
            <p className="text-sm text-zinc-400">Scroll this panel. {paused ? "Triggers are paused." : "Elements animate as they enter."}</p>
            <TextReveal as="h2" mode="word" text="Cinematic text reveals, word by word" className="text-3xl font-extrabold sm:text-5xl" />
            <Reveal {...reveal} className={CARD}>Reveal · {s.effect}</Reveal>
            <SpringPreview key={`${runId}-${s.stiffness}-${s.damping}-${s.mass}`} stiffness={s.stiffness} damping={s.damping} mass={s.mass} />
            <RevealGroup className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => <RevealItem key={i} effect={s.effect === "slide" ? "slide" : s.effect} direction={s.direction} easing={s.easing} speed={s.speed} className={`${CARD} h-28`}>{i + 1}</RevealItem>)}
            </RevealGroup>
            <ImageReveal className="h-56 rounded-xl"><div className="h-full w-full bg-[radial-gradient(circle_at_30%_30%,#a78bfa,#1f3170_60%,#0a1331)]" /></ImageReveal>
            <div className="h-72 overflow-hidden rounded-xl"><ParallaxLayer offset={80} scaleTo={1.15} intensity={s.intensity} className="h-[130%] -mt-[15%]"><div className="h-full w-full bg-[linear-gradient(135deg,#7c3aed,#16275a_50%,#0a1331)]" /></ParallaxLayer></div>
            <div className="text-center"><p className="text-sm text-zinc-400">Scroll-triggered counter</p><Counter to={1280450} className="text-gradient-animated text-5xl font-extrabold" /></div>
            <Reveal {...reveal} className={CARD}>Reveal · {s.effect}</Reveal>
            <div className="h-24" />
          </div>
        </MotionTierOverride>
      </div>
    </main>
  );
}

function Select<T extends string>({ label, value, options, onChange, disabled }: { label: string; value: T; options: readonly T[]; onChange: (v: T) => void; disabled?: boolean }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-zinc-200">{label}</label>
      <select id={id} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value as T)} className="h-10 w-full rounded-md border border-white/20 bg-[#1b2a52] px-2 text-sm disabled:opacity-50">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Range({ label, unit, min, max, step, value, onChange }: { label: string; unit: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex justify-between text-sm font-medium text-zinc-200"><span>{label}</span><span className="tabular-nums text-zinc-400">{value}{unit}</span></label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-6 w-full accent-[#7c3aed]" />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-10 cursor-pointer items-center justify-between gap-3 text-sm font-medium text-zinc-200">
      {label}
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-5 accent-[#7c3aed]" />
    </label>
  );
}

/** A ball that springs between two positions using the live stiffness/damping/mass; the tween under it is the ideal, undamped path. */
function SpringPreview({ stiffness, damping, mass }: { stiffness: number; damping: number; mass: number }) {
  const [right, setRight] = useState(false);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const feel = zeta < 0.4 ? "very bouncy" : zeta < 0.9 ? "bouncy" : zeta <= 1.1 ? "critically damped" : "sluggish";
  return (
    <section aria-label="Spring preview" className="rounded-xl border border-white/10 p-4">
      <div className="mb-3 flex items-center justify-between gap-3 text-sm">
        <span className="text-zinc-300">Spring · <strong data-testid="spring-feel" className="text-white">{feel}</strong> <span className="text-zinc-500">(ζ = {zeta.toFixed(2)})</span></span>
        <button type="button" onClick={() => setRight((r) => !r)} className="h-9 rounded-md bg-[#7c3aed] px-3 text-sm font-semibold">Toggle</button>
      </div>
      <div className="relative h-14 rounded-lg bg-black/30">
        <motion.div data-testid="spring-ball" animate={{ x: right ? 200 : 0 }} transition={{ type: "spring", stiffness, damping, mass }}
          className="absolute top-2 left-2 size-10 rounded-full bg-[#a78bfa] shadow-lg" />
      </div>
    </section>
  );
}
