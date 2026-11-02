/**
 * Framework-free core of the scroll animation system: effect definitions, easing, device tiers and
 * text splitting. Kept free of React and path aliases so it can be unit-tested with plain `node --test`.
 */

export const REVEAL_EFFECTS = ["fade", "slide", "zoom-in", "zoom-out", "scale-up", "scale-down", "rotate", "blur"] as const;
export type RevealEffect = (typeof REVEAL_EFFECTS)[number];

export const DIRECTIONS = ["up", "down", "left", "right"] as const;
export type Direction = (typeof DIRECTIONS)[number];

export const EASING_NAMES = ["out", "in-out", "spring", "linear", "back"] as const;
export type EasingName = (typeof EASING_NAMES)[number];
export type Bezier = [number, number, number, number];

export const EASINGS: Record<EasingName, Bezier> = {
  out: [0.22, 1, 0.36, 1],
  "in-out": [0.65, 0, 0.35, 1],
  spring: [0.34, 1.3, 0.64, 1],
  linear: [0, 0, 1, 1],
  back: [0.34, 1.56, 0.64, 1],
};

/** `none` = reduced motion (content shown, no movement); `lite` = low-power / small devices; `full` = everything. */
export type MotionTier = "none" | "lite" | "full";

export interface MotionEnvironment {
  reducedMotion: boolean;
  saveData?: boolean;
  /** `navigator.deviceMemory` in GB; undefined where unsupported (Safari, Firefox). */
  deviceMemory?: number;
  hardwareConcurrency?: number;
  viewportWidth: number;
}

export function resolveMotionTier(env: MotionEnvironment): MotionTier {
  if (env.reducedMotion) return "none";
  const weakDevice = (env.deviceMemory !== undefined && env.deviceMemory <= 2) || (env.hardwareConcurrency !== undefined && env.hardwareConcurrency <= 2);
  if (env.saveData || weakDevice) return "lite";
  return "full";
}

/** Multipliers applied to distances, durations and parallax strength for each tier and viewport. */
export function tierProfile(tier: MotionTier, viewportWidth: number) {
  if (tier === "none") return { distance: 0, duration: 0, parallax: 0, blur: false, stagger: 0 };
  const compact = viewportWidth < 640;
  if (tier === "lite") return { distance: compact ? 0.4 : 0.6, duration: 0.7, parallax: 0, blur: false, stagger: 0.03 };
  return { distance: compact ? 0.6 : 1, duration: 1, parallax: compact ? 0.5 : 1, blur: true, stagger: 0.06 };
}

export interface RevealState {
  opacity: number;
  x: number;
  y: number;
  scale: number;
  rotate: number;
  filter: string;
}

export const VISIBLE_STATE: RevealState = { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0, filter: "blur(0px)" };

export interface RevealOptions {
  effect?: RevealEffect;
  direction?: Direction;
  /** Base travel in px at full tier. */
  distance?: number;
  tier?: MotionTier;
  viewportWidth?: number;
}

/** The pre-reveal ("hidden") state for an effect. At tier `none` it is identical to the visible state, so nothing moves. */
export function hiddenState({ effect = "fade", direction = "up", distance = 32, tier = "full", viewportWidth = 1280 }: RevealOptions = {}): RevealState {
  if (tier === "none") return { ...VISIBLE_STATE };
  const profile = tierProfile(tier, viewportWidth);
  const d = distance * profile.distance;
  const hidden: RevealState = { ...VISIBLE_STATE, opacity: 0 };
  switch (effect) {
    case "slide":
      if (direction === "up") hidden.y = d;
      else if (direction === "down") hidden.y = -d;
      else if (direction === "left") hidden.x = d;
      else hidden.x = -d;
      break;
    case "zoom-in": hidden.scale = 0.85; break;
    case "zoom-out": hidden.scale = 1.15; break;
    case "scale-up": hidden.scale = 0.6; break;
    case "scale-down": hidden.scale = 1.4; break;
    case "rotate": hidden.rotate = tier === "lite" ? -4 : -10; hidden.scale = 0.96; break;
    case "blur": if (profile.blur) hidden.filter = "blur(12px)"; break; // blur is paint-heavy: lite falls back to a plain fade
    case "fade": break;
  }
  return hidden;
}

export interface RevealStates { hidden: Partial<RevealState>; visible: Partial<RevealState> }

/**
 * Hidden/visible keyframes containing only the properties that actually change, so a finished reveal leaves
 * no residual `transform` or `filter` behind (those would create stacking contexts and keep layers promoted).
 */
export function revealStates(options: RevealOptions = {}): RevealStates {
  const hidden = hiddenState(options);
  const hiddenOut: Partial<RevealState> = {};
  const visibleOut: Partial<RevealState> = {};
  for (const key of Object.keys(hidden) as (keyof RevealState)[]) {
    if (hidden[key] !== VISIBLE_STATE[key]) {
      (hiddenOut as Record<string, unknown>)[key] = hidden[key];
      (visibleOut as Record<string, unknown>)[key] = VISIBLE_STATE[key];
    }
  }
  return { hidden: hiddenOut, visible: visibleOut };
}

export function staggerDelay(index: number, step = 0.06, max = 0.6): number {
  return Math.min(Math.max(index, 0) * step, max);
}

export type SplitMode = "word" | "char";

/** Splits text into animatable units. Whitespace is preserved as its own unit so layout and wrapping match the original. */
export function splitText(text: string, mode: SplitMode): { value: string; space: boolean }[] {
  const parts = mode === "word" ? text.split(/(\s+)/) : Array.from(text);
  return parts.filter((p) => p !== "").map((value) => ({ value, space: /^\s+$/.test(value) }));
}

export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** Linear remap of `value` from one range to another, clamped to the output range. */
export function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  if (inMax === inMin) return outMin;
  const t = clamp((value - inMin) / (inMax - inMin), 0, 1);
  return outMin + (outMax - outMin) * t;
}

export type ScrollDirection = "up" | "down";

/**
 * Hide-on-scroll-down / reveal-on-scroll-up decision for a header.
 * Always visible near the top and while `pinned` (focus inside, menu open); small jitters are ignored.
 */
export function nextHeaderHidden(opts: { previousY: number; y: number; hidden: boolean; pinned?: boolean; topOffset?: number; threshold?: number }): boolean {
  const { previousY, y, hidden, pinned = false, topOffset = 120, threshold = 6 } = opts;
  if (pinned || y <= topOffset) return false;
  const delta = y - previousY;
  if (Math.abs(delta) < threshold) return hidden;
  return delta > 0;
}
