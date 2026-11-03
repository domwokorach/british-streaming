# Styling Guide

The design-system reference for British Streaming: tokens, typography, breakpoints, components and animation. Every value here was read from the code (`src/app/globals.css`, `src/lib/motion.ts`, component sources) unless it is marked **Recommended**. Architecture lives in [DESIGN.md](./DESIGN.md); rules in [RULE.md](./RULE.md).

Stack: Tailwind CSS 4 (CSS-first configuration in `globals.css`; there is no `tailwind.config`), shadcn/ui style `base-nova` (see `components.json`), `class-variance-authority` and the `cn()` helper.

## Colour tokens

Defined as CSS variables under `:root` and exposed to Tailwind through `@theme` as `--color-ws-*`, so they are usable as `bg-ws-card`, `text-ws-text-2`, `border-ws-border` and so on.

| Tailwind name | CSS variable | Hex | Use |
|---|---|---|---|
| `ws-bg` | `--ws-bg` | `#101116` | Page background |
| `ws-card` | `--ws-card` | `#1E1E2E` | Cards, dialogs, dock, inputs |
| `ws-elevated` | `--ws-elevated` | `#272735` | Raised surfaces, hover fills |
| `ws-border` | `--ws-border` | `#374151` | Borders, scrollbar thumb |
| `ws-text` | `--ws-text` | `#F8FAFC` | Primary text |
| `ws-text-2` | `--ws-text-2` | `#A1A1AA` | Secondary text |
| `ws-muted` | `--ws-muted` | `#64748B` | **Secondary Grey**: decorative or large text only (see contrast) |
| `ws-blue` | `--ws-blue` | `#2563EB` | **Primary Blue**: primary actions, active states |
| `ws-blue-bright` | `--ws-blue-bright` | `#3B82F6` | Blue hover/progress |
| `ws-blue-light` | `--ws-blue-light` | `#60A5FA` | **Light Blue**: links and accents on dark |
| `ws-navy` | `--ws-navy` | `#1E3A8A` | Deep blue fills |
| `ws-purple` | `--ws-purple` | `#7C3AED` | **Premium Purple**: badges, secondary actions |
| `ws-purple-electric` | `--ws-purple-electric` | `#8B5CF6` | Purple hover, gradients |
| `ws-lavender` | `--ws-lavender` | `#A78BFA` | **Soft Purple**: hover text, highlights |
| `ws-purple-deep` | `--ws-purple-deep` | `#4C1D95` | Deep purple fills |

Semantic bridge to shadcn tokens (dark theme): `--background: var(--ws-bg)`, `--primary: var(--ws-blue)`; the app is dark-only (`<html class="dark">`).

Z-index tokens: `--z-carousel: 0`, `--z-row-hover: 30`, `--z-preview: 35`, `--z-header: 40`, `--z-backdrop: 80`, `--z-modal: 90`, `--z-notification: 100`.

Radius: base `--radius: 0.375rem` with derived `--radius-sm` to `--radius-4xl` (multipliers 0.6, 0.8, 1, 1.4, 1.8, 2.2, 2.6).

```tsx
// Use tokens, not raw hex
<div className="rounded-xl border border-ws-border bg-ws-card text-ws-text">
  <p className="text-ws-text-2">Secondary copy</p>
  <a className="text-ws-blue-light hover:text-ws-lavender">Link</a>
</div>
```

### Contrast (computed WCAG ratios)

Normal text needs 4.5:1, large text and UI components 3:1.

| Pair | Ratio | Verdict |
|---|---|---|
| `ws-text` on `ws-bg` | 18.0 | Pass |
| `ws-text-2` on `ws-bg` / `ws-card` | 7.4 / 6.4 | Pass |
| `ws-blue-light` on `ws-bg` | 7.4 | Pass |
| `ws-lavender` on `ws-bg` | 6.9 | Pass |
| White on `ws-blue` | 5.2 | Pass |
| White on `ws-purple` | 5.7 | Pass |
| White on `ws-purple-electric` | **4.2** | Fails for small text; use for large or decorative text only, or use `ws-purple` |
| `ws-muted` on `ws-bg` / `ws-card` | **4.0 / 3.5** | Fails for body text; large text and decoration only |
| `ws-blue` on `ws-bg` | 3.7 | Fine for UI borders and large text, not for small text; use `ws-blue-light` for text |
| `ws-purple` on `ws-bg` | 3.3 | Same: UI/large only; use `ws-lavender` for text |

An axe run (3 November 2026, development server) flagged the hero rating badge (white on `ws-purple-electric`, 4.2) and a label-in-name mismatch on "Recently Added" card buttons. Both are open issues.

## Typography

| Role | Font | Source |
|---|---|---|
| UI text | **Figtree** | `next/font/google` in `src/app/layout.tsx`, exposed as `--font-sans` |
| Code / mono | **Geist Mono** | `next/font/google`, `--font-geist-mono`, mapped to `--font-mono` |
| Headings | Geist stack (`--font-heading`) | defined in `@theme`; most headings use the sans font in practice |

`globals.css` still lists `"Netflix Sans"` first in the fallback list of the `@theme` `--font-sans`. It is not bundled and is overridden by Figtree at runtime. **Recommended:** remove that third-party name from the stack.

Observed type scale (Tailwind utilities used in the code):

| Role | Classes in use |
|---|---|
| Page title (`h1`) | `text-3xl font-bold` (hero title scales `text-4xl sm:text-6xl lg:text-7xl font-black`) |
| Section/row title (`h2`) | `text-lg font-medium sm:text-[22px] sm:leading-7` |
| Dialog / auth heading | `text-2xl font-bold sm:text-3xl` |
| Body | `text-sm`/`text-base`, `leading-6`/`leading-7` for paragraphs |
| Caption / metadata | `text-xs` (`text-[11px]` for badges) |
| Card title overlay | `text-[clamp(11px,1.1vw,16px)] font-extrabold uppercase leading-tight` |

Truncation: `line-clamp-1` for card captions, `line-clamp-2` for card titles and previews, `line-clamp-3/4` for hero descriptions. Never rely on clipping for essential text. Letter spacing is tight only on display text (`tracking-tight`, `tracking-[-0.03em]`).

## Responsive breakpoints

The project uses **Tailwind's default breakpoints** plus two **arbitrary** ones; it does not redefine breakpoints and does not use container queries in application code (only shadcn `Card`/`Field` use `@container` internally).

| Range | Device class | Tailwind |
|---|---|---|
| < 480px | Small mobile | base styles |
| 480-639px | Mobile | `min-[480px]:` |
| 640-767px | Large mobile | `sm:` (640) |
| 768-1023px | Tablet | `md:` (768) |
| 1024-1279px | Laptop | `lg:` (1024) |
| 1280-1919px | Desktop | `xl:` (1280) |
| 1920px+ | Ultrawide | `min-[1920px]:` |

`2xl` (1536px) is available but not used for layout. Use `dvh` and `env(safe-area-inset-*)` instead of `vh` where the browser UI resizes. Hover behaviour is gated by capability, not width: `useHasHover()` or `(hover: hover) and (pointer: fine)`.

## Buttons

Base component: `src/components/ui/button.tsx` (variants through `cva`).

**Baseline padding.** Every `Button` size that has text uses a **5px** base and responsive horizontal steps:

```tsx
"px-[5px] py-[5px] sm:px-[6px] md:px-[8px] lg:px-[10px] xl:px-[12px]"
```

| Breakpoint | < 640 | `sm` | `md` | `lg` | `xl` |
|---|---|---|---|---|---|
| Horizontal | 5px | 6px | 8px | 10px | 12px |
| Vertical | 5px | 5px | 5px | 5px | 5px |

Heights are fixed per size, so visible padding stays small while the hit area is made accessible with height, `min-h-*` and wrapper hit areas, not by raising padding.

| Variant | Look (from `button.tsx`) |
|---|---|
| Primary (`default`) | `bg-primary` (Blue) with `text-primary-foreground`, `hover:bg-primary/80` |
| Secondary | `bg-secondary text-secondary-foreground` |
| Outline | border, `bg-background`, `hover:bg-muted` |
| Ghost | transparent, `hover:bg-muted` |
| Destructive | tinted `bg-destructive/10` |
| Link | `text-primary underline-offset-4 hover:underline` |

Sizes: `default` h-8, `xs` h-6, `sm` h-7, `lg` h-9, icons `size-8`, `icon-xs` 6, `icon-sm` 7, `icon-lg` 9 (Tailwind units; multiply by 4px).

States:

- **Loading:** `SubmitButton` swaps the label for `<Spinner>` plus a pending label, sets `aria-busy`, and is disabled. On success it shows a check.
- **Disabled:** `disabled:pointer-events-none disabled:opacity-50` (70% on the hover button). Disabled controls are also `disabled` in the DOM.
- **Focus:** `focus-visible:ring-3 focus-visible:ring-ring/50` (base) or a white 2px ring with offset on dark surfaces.
- **Press:** `active:scale-[0.97]`, removed under reduced motion on the hover button.

**Interactive Hover Button** (`ui/interactive-hover-button.tsx`, adapted from Magic UI): full-width, `min-h-12` (48px), `rounded-xl`, blue fill, a dark disc that grows on hover while the label slides out and a copy with an arrow slides in. The duplicate label is `aria-hidden`; reduced motion removes the slide and fill. `InteractiveHoverLink` is the same for navigation.

Icon buttons MUST have an accessible name (`aria-label`) and a 44px target where practical (for example `size-11`).

## Media cards

Component: `src/components/content/media-card.tsx`.

| Property | Value |
|---|---|
| Landscape thumbnail | `aspect-video` (16:9) |
| Top 10 poster | `aspect-[2/3]` |
| Width | Set by the carousel (basis), never fixed |
| Gap | `pr-1 sm:pr-2` per item (4px / 8px) |
| Radius | `rounded-[6px]` |
| Surface | `bg-ws-card` behind artwork while it loads |
| Image | `next/image` `fill`, `object-cover`, accurate `sizes`; falls back to the backdrop, then a placeholder icon |
| Badges | "Recently Added": `bg-ws-purple`, 10px semibold; progress bar: `h-[3px]` `bg-ws-blue-bright` |
| Focus | `focus-visible:ring-2 focus-visible:ring-white` |
| Expanded preview | Portal, `rounded-md bg-ws-card`, shadow `0_18px_40px_rgba(0,0,0,0.7)` plus a faint purple glow, `ring-1 ring-ws-purple-electric/30`, width `max(300px, 1.5 x card)` clamped to the viewport, 16:9 media above an info panel |

```tsx
<button className="relative block aspect-video w-full overflow-hidden rounded-[6px] bg-ws-card outline-none focus-visible:ring-2 focus-visible:ring-white" />
```

## Carousels

Component: `src/components/content/content-row.tsx`.

| Property | Value |
|---|---|
| Slides per view | `basis-1/2` (<480) `min-[480px]:basis-1/3` `md:basis-1/4` `lg:basis-1/5` `xl:basis-1/6` `min-[1920px]:basis-[14.2857%]` (7-up) |
| Top 10 rows | `basis-[70%]` `min-[480px]:basis-1/2` `md:basis-1/3` `lg:basis-1/4` `xl:basis-1/5` `min-[1920px]:basis-1/6` |
| Gutter | `px-4 sm:px-[58px]` on heading and track; the track uses `pl-4 sm:pl-[58px]` plus an end spacer |
| Snap | Embla: `align: "start"`, `slidesToScroll: "auto"`, `containScroll: "trimSnaps"`, `duration: 28` |
| Navigation arrows | `w-[50px]` full-height edge buttons, `bg-black/50`, visible on row hover or focus, hidden when disabled and on touch |
| Touch / mouse | Embla swipe and drag; arrow keys when a row has focus |
| Overflow | Viewport is `overflow-x-clip overflow-y-visible`; page never scrolls horizontally |
| Overlay positioning | Hover previews and details render in portals above clipping (`--z-preview`); `previewGeometry()` clamps to an 8px viewport margin |

```tsx
<Carousel opts={{ align: "start", slidesToScroll: "auto", containScroll: "trimSnaps", duration: 28 }}>
  <CarouselContent className="ml-0 pl-4 sm:pl-[58px]">
    <CarouselItem className="pl-0 pr-1 sm:pr-2 basis-1/2 min-[480px]:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">…</CarouselItem>
    <div aria-hidden className="shrink-0 grow-0 basis-4 sm:basis-[58px]" />
  </CarouselContent>
</Carousel>
```

## Animation tokens

From `src/lib/motion.ts` (use these, not ad-hoc numbers).

| Token | Value (seconds) |
|---|---|
| `DURATION.micro` | 0.14 |
| `DURATION.button` | 0.18 |
| `DURATION.menu` | 0.19 |
| `DURATION.card` | 0.22 |
| `DURATION.modal` | 0.26 |
| `DURATION.page` | 0.32 |
| `DURATION.carousel` | 0.38 |
| `DURATION.hero` | 0.7 |

| Easing | Cubic-bezier |
|---|---|
| `EASE.out` | `0.22, 1, 0.36, 1` (default "appear") |
| `EASE.in` | `0.4, 0, 1, 1` |
| `EASE.inOut` | `0.65, 0, 0.35, 1` |

| Spring | Stiffness / damping | Use |
|---|---|---|
| `SPRING.press` | 550 / 30 | Buttons, taps |
| `SPRING.card` | 320 / 28 | Card hover and lift |
| `SPRING.soft` | 180 / 26 | Panels, overlays, form-item entrance |
| `SPRING.bouncy` | 380 / 16 | Rare emphasis |

Other values in use:

| Behaviour | Value |
|---|---|
| Hover-preview open delay | 400ms |
| Preview close grace period | 120ms |
| Trailer start delay | 600ms |
| Preview scale-out | from card size to `1.5x` (min 300px wide) with a spring (stiffness 380, damping 34) |
| Hover card scale | keep subtle: <= `1.03` for images; avoid layout-affecting scaling |
| Modal | `DURATION.modal` fade/scale via Animate UI dialog |
| Scroll reveal | `Reveal` component: fade or slide 12-20px, 0.4-0.5s, `amount` 0.1, stagger `0.04s` capped at six items |
| Route enter | `page-enter`: opacity only, 0.32s, `cubic-bezier(0.22, 1, 0.36, 1)` |
| Marquee speed | `slow` = 80s per loop, `normal` = 45s, `fast` = 25s |

Rules: animate **transform and opacity only**; use the tier from `useMotionTier()` to scale effects down (`lite`) or off (`none`); never block input; never autoplay audio.

```css
/* Every custom CSS animation needs a reduced-motion override */
@media (prefers-reduced-motion: reduce) { .text-gradient-animated { animation: none; } }
```

```tsx
// Motion with shared tokens
<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: DURATION.card, ease: EASE.out }} />
```

## Accessibility

Target: **WCAG 2.2 AA**. The target is a goal; conformance has not been formally audited, and the public statement is at `/accessibility`.

- **Keyboard:** all controls reachable with Tab; arrow keys on carousels and the hero; Escape closes previews and dialogs; the dock and header links are real links.
- **Focus:** visible on every control (`focus-visible:ring-2` or outline); focus returns to the opener when a dialog closes; non-modal previews do not trap focus.
- **Contrast:** use the pairs marked Pass above; do not use `ws-muted`, `ws-blue` or `ws-purple` for small text on dark surfaces.
- **Reduced motion:** `MotionProvider` plus per-component handling; see [DESIGN.md](./DESIGN.md#5-animation-architecture-implemented).
- **Screen readers:** landmarks (`header`, `main`, `nav` with unique names, `footer`), labelled carousels (`role="region"` + `aria-roledescription`), `aria-current="page"` on active nav, hidden duplicate marquee copies (`aria-hidden`, `tabIndex -1`).
- **Touch targets:** aim for 44x44px (dock items are 44px, icon buttons `size-11`, hover button 48px).
- **Text and zoom:** layouts use relative units and wrap; verify at 200% zoom and 320px width.

## Maintenance

Change a token in one place (`globals.css`), then update this file in the same pull request. Run the responsive and accessibility specs listed in [RULE.md](./RULE.md#9-verification).
