# Scroll animations

Built on `motion/react` (already a dependency) plus a little CSS. No GSAP, no smooth-scroll library, no custom scroll
hijacking: the browser keeps native scrolling, momentum and touch gestures.

## Pieces

| Path | Purpose |
| --- | --- |
| `src/lib/scroll-motion.ts` | Pure logic: effects, easings, device tiers, text splitting, header hide rule. Unit-tested. |
| `src/hooks/use-motion-profile.ts` | `useMotionTier()` / `useMotionProfile()`: `none` (reduced motion), `lite` (weak device or data-saver), `full`. |
| `src/hooks/use-scroll-direction.ts` | `useHeaderHidden()`: one passive listener, one read per frame, state only changes when the decision flips. |
| `src/components/motion/reveal.tsx` | `Reveal`, `RevealGroup` + `RevealItem` (stagger), `TextReveal`, `ImageReveal`. |
| `src/components/motion/parallax.tsx` | `ParallaxLayer`: scroll-linked translate/scale/opacity from MotionValues (no re-renders). |
| `src/components/motion/scroll-progress.tsx`, `scroll-to-top.tsx`, `counter.tsx` | Progress bar, back-to-top button, count-up number. Progress and back-to-top are mounted in `app/layout.tsx`. |
| `src/app/template.tsx` + `.page-enter` in `globals.css` | CSS-only route entrance; runs from first paint and never blocks navigation. |
| `src/components/motion/scroll-lab.tsx` | Dev preview panel at `/dev/scroll-lab` (404 in production builds). |

## Using it

```tsx
import { Reveal, RevealGroup, RevealItem, TextReveal } from "@/components/motion";

<Reveal effect="slide" direction="up" duration={0.6} delay={0.1} easing="out" amount={0.25}>…</Reveal>
<Reveal effect="blur" once={false}>…</Reveal>           {/* replays, and reverses when it leaves the viewport */}

<RevealGroup stagger={0.06} className="grid …">
  {items.map((i) => <RevealItem key={i.id} effect="zoom-in">…</RevealItem>)}
</RevealGroup>

<TextReveal as="h2" mode="char" text="Now streaming" />
```

Effects: `fade`, `slide` (+ `direction`), `zoom-in`, `zoom-out`, `scale-up`, `scale-down`, `rotate`, `blur`.
"Fade out" and the reverse directions are what `once={false}` gives you when an element leaves the viewport.
`speed` is a tempo multiplier (2 = twice as fast). `amount` is the visible fraction that triggers the effect.

## Where it is applied

- Header: transparent at the top, solid with a shadow once scrolled, hides on scroll down and returns on scroll up.
  It never hides while a keyboard user has focus inside it. Active links get an underline wipe.
- Home hero: backdrop drifts and zooms, copy fades and lifts as you scroll past (transform/opacity only).
- Content rows: heading slides in; cards fade-and-scale in with a capped stagger. Dragging, momentum, keyboard arrows and
  prev/next come from the existing Embla carousel.
- Every route: CSS entrance via `template.tsx`.
- Global: reading-progress bar, scroll-to-top, smooth in-page anchors with header-aware `scroll-padding-top`.

## Performance rules

- Only `transform`, `opacity` (plus `clip-path`/`filter` where an effect needs it) are animated, never layout properties.
- Reveals use IntersectionObserver via `whileInView`; there are no app-level scroll listeners except the header's single
  passive, rAF-coalesced one. Parallax and progress are driven by MotionValues, so scrolling does not re-render React.
- Finished reveals leave no `transform` or `filter` behind (only changed properties are animated).
- `lite` tier (≤2 GB memory, ≤2 cores, or `Save-Data`) halves travel, drops parallax and blur. Phones get ~60% travel and half-strength parallax.

## Accessibility

- `prefers-reduced-motion` (and the lab's "Reduced-motion preview") resolves to tier `none`: nothing moves, content shows
  immediately. A CSS guard also forces `[data-reveal]` visible so there is no hidden flash before hydration.
- `TextReveal` renders one sr-only copy of the text; the split spans are `aria-hidden`.
- `Counter` exposes its final value to screen readers immediately.
- Decorative elements (progress bar) are `aria-hidden`; the back-to-top button is a labelled, focus-visible button.

## Tests

- `npm run test:motion`: unit tests for `scroll-motion.ts` (tiers, effects, stagger, text splitting, header rule). Runs in CI.
- `tests/e2e/scroll-motion.spec.ts`: header hide/reveal, keyboard pinning, back-to-top, progress bar, reduced motion, route change.
  The e2e suite needs `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` set (CI already does this for the build).

## Known gaps

- Carousel scroll position is not restored when navigating back (route scroll position is, via Next).
- No scroll-controlled video, scroll-highlighted text or sticky-panel sequences yet; add them with `useScroll` + `useTransform`.
- Reveals are applied to the home page rows only so far; wrap other sections in `Reveal` as needed.
