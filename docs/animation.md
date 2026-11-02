# Animation system

Motion (`motion/react`) for custom animation, Animate UI (`@animate-ui/react/...`) for UI primitives (dialog, menu, tooltip, tabs, accordion, carousel). Always import Animate UI from its subpath (`@animate-ui/react/primitives/...`, `@animate-ui/react/provider`), never the package root.

| Piece | Where |
|---|---|
| Global config (`MotionConfig` + `AnimateUIProvider`, both `reducedMotion="user"`) | `src/providers/motion-provider.tsx` |
| Tokens: durations, easing, **springs** (`SPRING.press/card/soft/bouncy`) | `src/lib/motion.ts` |
| Device/user motion tier (`none` = reduced motion, `lite` = weak device or data-saver, `full`) | `src/hooks/use-motion-profile.ts`, `src/lib/scroll-motion.ts` |
| Scroll reveals, staggers, text/image reveal, parallax, counter, progress bar, scroll-to-top | `src/components/motion/*` |
| Carousel autoplay (timer-based, pausable) | `src/hooks/use-carousel-autoplay.ts`, `src/components/content/content-row.tsx` |
| Auth form motion (`AnimatedForm`, `FormAlert`, `SubmitButton`) | `src/components/account/fields.tsx` |
| Page-enter transition | `src/app/template.tsx` + `.page-enter` in `globals.css` |
| Playground | `/dev/scroll-lab` (dev builds; in production set `ANIMATION_LAB_ENABLED=true`) |

## Rules we follow
- Animate **transform and opacity only**; no layout properties.
- Content is always in the DOM and readable; animation only changes how it paints in. Reduced-motion users see everything immediately (`[data-reveal]` is force-visible by CSS).
- Animation never gates behaviour: auth forms are interactive as soon as React hydrates, and the submit button/inputs wait for hydration so typing is never lost.
- Anything that moves by itself (carousel autoplay) has a visible pause control, stops on hover/focus/touch, when the tab is hidden, when off-screen, and under reduced motion. Autoplay is opt-in per row: `<ContentRow autoplayMs={7000} loop />` (currently only the first row on the home page).
- Scroll effects use Motion's `useScroll`/`useInView` (IntersectionObserver / rAF-batched), not hand-written scroll listeners.

## Tests
`tests/e2e/animation.spec.ts` (carousel keys/buttons/autoplay/pause/reduced-motion, card hover vs tap, auth motion, tabs/accordion, playground controls, hydration warnings, route transition) plus `scroll-motion.spec.ts`. Catalogue-dependent tests skip when no TMDB token is configured.
