# Engineering Rules

Rules for everyone who changes British Streaming, **including AI coding assistants**. They describe how this repository already works. If a rule here and the code disagree, the code is the fact: fix the rule in the same change.

Related: [README.md](./README.md) (setup) · [DESIGN.md](./DESIGN.md) (architecture) · [STYLING.md](./STYLING.md) (tokens) · [AGENTS.md](./AGENTS.md) (Next.js note for agents).

Words: **MUST** and **MUST NOT** are requirements; **SHOULD** is the default unless there is a stated reason.

## 1. Before you change anything

1. Read `AGENTS.md`. This repository uses a Next.js version (16.x) with breaking changes from older releases; read the relevant guide in `node_modules/next/dist/docs/` before writing Next-specific code.
2. Inspect the existing implementation and find every component, route and test that the change touches (search; do not assume).
3. Reuse what is installed. Do not add a dependency or a second library for something the project already does (see [Dependencies](#7-dependencies)).
4. Follow the existing design tokens and conventions.
5. Change incrementally; keep each change reviewable and working.
6. Run the checks listed in [Verification](#9-verification).
7. Report what changed, what you verified and what remains uncertain.

**Never claim that something was tested, built, deployed or "works" unless you ran it and saw the result.** If a check could not run (no database, no Docker, a slow machine), say so plainly.

## 2. Code quality

- **TypeScript.** The project is strict TypeScript. No `any` unless a library forces it, and then with a comment. Prefer `unknown` plus narrowing at boundaries.
- **Conventions first.** Match the surrounding code: naming, file layout (`src/components/<area>`, `src/hooks`, `src/lib`, `src/providers`), import aliases (`@/…`) and comment density.
- **Reuse.** Extract repeated UI or logic into a component or hook; do not copy-paste. Shared media behaviour lives in `MediaCard`, `ContentRow`, `MovieHoverPreview`, `TitleDetails`, `NavLink`, `AuthShell` and the field components; extend them rather than forking them.
- **Naming.** Components `PascalCase`, hooks `useThing`, files `kebab-case.tsx`, constants `SCREAMING_SNAKE_CASE` only for true module constants.
- **Focused modules.** One responsibility per file; split when a file mixes data fetching, layout and behaviour.
- **Errors.** Fail loudly at boundaries with structured errors (see `src/lib/auth/errors.ts` and the `api()` client), return the generic message to users and log detail on the server. Never swallow an error silently; never leak internals to the client.
- **Comments** explain why, not what. Do not leave dead code, commented-out blocks or stray `console.log`.

## 3. React and Next.js

- **Routing.** Follow the App Router layout in `src/app`. A page that needs data is a **Server Component**; push `"use client"` as far down the tree as possible.
- **Client Components only when needed:** state, effects, event handlers, browser APIs, `motion`. Do not mark a whole page client-side to avoid thinking about the boundary.
- **Server to client boundary.** Props crossing it MUST be serialisable. **Functions cannot be passed from a Server Component to a Client Component**; wrap the client behaviour in a small client component and pass data (see `PicksStrip`). Ignoring this crashes the page at render time.
- **Hydration.** Output MUST be identical on server and first client render. Read `window`, `matchMedia`, `localStorage` or `Date.now()` only inside effects or via the existing hooks (`useMediaQuery`, `useHasHover`, `useHydrated`). Do not branch markup on those values during render.
- **Re-renders.** Memoise only measured hot paths. Keep state as local as possible. Use stable keys (never array index for reorderable data; `MediaTitle.id` is the stable id).
- **Hooks.** Every effect that adds a listener, observer, timer or animation frame MUST clean it up. Respect the Rules of Hooks; do not call hooks conditionally.
- **Semantics.** Use real `<button>`, `<a>`/`Link`, `<nav>`, `<main>`, `<footer>`, headings in order, labelled regions. Landmarks with the same role MUST have distinct accessible names.
- **Navigation.** Primary navigation links MUST use `NavLink` (`src/components/layout/nav-link.tsx`) so click-to-scroll works. Use `next/link` for other internal links; plain `<a>` only for external URLs.
- **Page sections.** New primary destinations need a stable content id registered in `src/lib/nav-targets.ts` and applied with `NAV_SCROLL_MARGIN_CLASS`.
- **Images.** Use `next/image` with accurate `sizes`; preserve aspect ratio with `aspect-*`; lazy-load below the fold.

## 4. UI and UX

- **Brand.** The product is **British Streaming**; read the name from `src/lib/brand.ts` instead of hard-coding it. Do not reintroduce legacy names in user-facing text.
- **Colours.** Use the `ws-*` tokens and semantic tokens (`bg-ws-bg`, `bg-ws-card`, `text-ws-text`, `text-ws-text-2`, `bg-ws-blue`, `bg-ws-purple`, `text-ws-lavender`) from [STYLING.md](./STYLING.md). Do not add raw hex colours to components when a token exists; if a new colour is genuinely needed, add a token first.
- **Spacing.** Use the existing gutters (`px-4 sm:px-[58px]` on rows) and spacing scale.
- **Buttons.** Keep the **5px baseline padding** (`px-[5px] py-[5px]` rising to `sm:6 md:8 lg:10 xl:12` horizontally) on `Button` sizes and the interactive hover button. Interactive targets SHOULD be at least 44x44px where practical (use `min-h-*`/hit areas, not extra visible padding).
- **No horizontal overflow** at any width from 320px. Check new layouts at 320, 375, 768, 1024, 1440 and 1920.
- **Never clip essential UI.** Carousel viewports clip on the X axis only. Previews, popovers and menus render through a portal. Do not add `overflow: hidden` to an ancestor of a focusable or expandable element without checking focus rings and previews.
- **Fixed header.** No ancestor of the fixed header may use `transform`, `filter` or `perspective` (it breaks `position: fixed`). Route and page entrance animations MUST be opacity-only.
- **Single scroll offset.** `html { scroll-padding-top }` in `globals.css` is the one source of the header offset. Do not stack `scroll-margin-top` on targets.
- **Responsive.** Mobile-first. Support phone, tablet and desktop, portrait and landscape, and safe areas (`env(safe-area-inset-*)`).
- **Touch.** Hover is an enhancement only. Gate hover behaviour with `useHasHover()` / `(hover: hover) and (pointer: fine)`; the same function MUST be reachable by tap and keyboard.
- **Accessibility target: WCAG 2.2 AA.** Visible focus on every control, sufficient contrast, labels for icon buttons, no keyboard traps in non-modal previews, focus trapped and restored for modals. Do not claim conformance; only the audit process can.

## 5. Animation

- **Reduced motion is mandatory.** Honour `prefers-reduced-motion` (the global `MotionProvider` sets `reducedMotion="user"`; custom CSS animations need an explicit `motion-reduce:` or media-query override).
- **Transform and opacity only.** Do not animate layout properties (`width`, `height`, `top`, margins) in hot paths.
- **Continuous motion needs controls.** Anything that moves on its own MUST pause on hover and focus, offer a visible pause control, stop when the tab is hidden or the element is off-screen, and have a static fallback for reduced motion.
- **No competing transforms** on one element (for example a hover highlight and an expanding preview). Give each effect its own element.
- **No hover flicker.** Previews use an open delay (400ms), a close grace period (120ms) and a portal that the pointer may enter; keep that contract when editing.
- **One preview at a time.** Hover previews and trailers go through `use-active-preview`. At most one trailer plays, and it is muted by default.
- **Never autoplay audio.** Sound only after an explicit user action.
- **Pause inactive video.** Unmount preview iframes when the preview closes; load trailer data lazily and cache it.
- **Animation never blocks input.** Forms and buttons stay usable during transitions; reveal wrappers must not hide content from users without JavaScript or with reduced motion.
- **Use the shared tokens** in `src/lib/motion.ts` (`DURATION`, `EASE`, `SPRING`) instead of ad-hoc numbers.
- **Animate UI** is imported only from its subpaths (`@animate-ui/react/primitives/...`), never the package root.

## 6. Security

- **Server-side authority.** Authentication and authorisation MUST be enforced on the server. `src/proxy.ts` page guards are UX only; every API route re-validates the session (JWT **and** the live session row).
- **Private routes.** New signed-in pages MUST be added to the `PROTECTED` list in `src/proxy.ts` and their APIs MUST check the session.
- **JWT and sessions.** Keep the design in [docs/auth.md](./docs/auth.md): HS256 pinned, short-lived access token, rotating opaque refresh token, HttpOnly `__Host-` cookies. Never store tokens in `localStorage` or `sessionStorage`; never expose them to client JavaScript.
- **Do not change** JWT issuer or audience defaults (`worldstreaming`, `worldstreaming-web`), the cookie names, the token lifetimes or the auth routes as a side effect of branding or refactoring. Changing the issuer or audience invalidates every existing session.
- **CSRF.** State-changing requests need a same-origin `Origin` and the `x-ws-csrf: 1` header; use the shared `api()` client.
- **Validate input.** Parse every request body, query and param with Zod (`src/lib/auth/schemas.ts` pattern) before use. Validate redirects with `safeNext`.
- **Secrets.** Never commit secrets or paste them into issues, logs, screenshots or AI prompts. `.env*` files stay untracked. The service-role key and TMDB token are server-only (`import "server-only"`). Only `NEXT_PUBLIC_*` values may reach the browser, and they MUST NOT be secrets.
- **User data.** Scope every database query by the verified user id. Do not log passwords, tokens or raw email addresses.
- **Test mode.** `AUTH_STORE=memory` and `AUTH_UNSAFE_TEST_MODE=1` are for local tests only and MUST NOT be enabled in any deployed environment.
- **Dependencies.** Review new packages for licence and maintenance (see [LICENSE.md](./LICENSE.md)); CI runs secret scanning and dependency audit.

## 7. Dependencies

- Prefer what is installed (Motion, Animate UI, Embla, Lucide, shadcn/ui primitives). Do not add a second animation, carousel, icon or modal library.
- UI sources from shadcn, Aceternity UI and Magic UI are **copied into** `src/components/ui/` and then owned by this repo. Re-running an `npx shadcn@latest add …` command overwrites local adaptations; commit first and diff afterwards.
- Check the licence of any new dependency before adding it and record unusual terms in [LICENSE.md](./LICENSE.md).
- `package.json` MUST NOT contain `"type": "commonjs"`: the codebase is ES modules and the build fails with it.

## 8. Git and CI/CD

- **Commits.** [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:` ...), enforced by commitlint and the `conventional-commits` CI job. Messages say what and why. Do not add AI attribution lines unless the repository owner asks.
- **Branches.** Do not push directly to `main`. Open a pull request; `.github/CODEOWNERS` requires code-owner review for infra, workflows and SLO files. Branch protection is applied with `scripts/git/protect-main.sh`.
- **Checks.** A change should pass lint, type-check and the relevant tests locally before review; CI runs validate, e2e, secrets-and-deps, conventional-commits, terraform and container jobs.
- **Releases.** release-please manages versions and changelog from commit messages.
- **Infrastructure.** Terraform changes go through the Terraform workflow (plan on PR, apply on deploy). Document configuration changes in `docs/` and update the runbooks when procedures change.
- **Rollback.** Every deploy-affecting change MUST have a rollback path: see [docs/runbooks/rollback.md](./docs/runbooks/rollback.md). Database migrations MUST say whether they are reversible and what data they delete.
- **Do not weaken** security or reliability gates (secret scan, SLO gate, approvals) to make a pipeline pass.

## 9. Verification

Run what applies to your change and report the actual result.

| Change | Minimum checks |
|---|---|
| Any TypeScript | `npm run typecheck` and `npm run lint` |
| UI or layout | Load the page at 320, 375, 768, 1024, 1440, 1920; check no horizontal scroll; `npx playwright test tests/e2e/responsive.spec.ts` |
| Carousels, previews, marquee | `tests/e2e/media-gallery.spec.ts` |
| Navigation | `tests/e2e/navigation.spec.ts`, `tests/e2e/nav-scroll.spec.ts` |
| Accessibility | `tests/e2e/a11y.spec.ts` (axe) and a keyboard pass |
| Auth | `tests/e2e/auth-*.spec.ts` (needs the in-memory test server from `playwright.config.ts`) |
| Ops, SLOs | `npm run test:ops`, `npm run slo:rules:check` |
| Anything shipped | `npm run build` |

Practical notes learned the hard way:

- **Do not run `npm run build` while `npm run dev` is running in the same folder.** The build clears `.next`; the dev server then returns 500s until restarted.
- E2E against `next dev` is slow and flaky on busy machines; prefer a production build (`npm run build && npm run start:standalone`) and `E2E_BASE_URL=...`, with `--workers=1`.
- Playwright `hover()` waits for the target to stop moving, which never happens for a moving marquee; move the pointer to the target's current coordinates instead.
- A click before React hydrates is a plain browser navigation; wait for network idle in tests that exercise client-side navigation.

## 10. Documentation

When behaviour, routes, tokens, architecture, dependencies or licensing change, update the matching file in the same pull request: README (setup, routes, features), DESIGN (architecture, components), STYLING (tokens, components, animation), RULE (policy), LICENSE and COPYRIGHT (only with owner approval and, for legal content, legal review). Mark planned work as planned.
