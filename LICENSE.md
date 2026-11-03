# Licensing Status

> **This file is not a licence grant.** No open-source or commercial licence has been chosen for British Streaming. Until the project owner decides and records a licence here, **no permission to use, copy, modify or distribute the original source code is granted** by this repository. Do not assume the project is open source.

Related: [COPYRIGHT.md](./COPYRIGHT.md) (ownership, attribution, content rights) · [README.md](./README.md)

## 1. Current status (as inspected)

| Item | Finding |
|---|---|
| `LICENSE`, `LICENSE.md`, `LICENSE.txt`, `COPYING` in the repository | **None existed** before this file. |
| `package.json` `"license"` field | `ISC`. This appears to be the default value written by `npm init`, together with `"author": "Dominic Wokorach"`, `"main": "index.js"` and `"description": "british streaming"` in the same commit. It is metadata only and is **not** a deliberate, documented licence decision. |
| `package.json` `"private"` | `true` (the package is not intended for publication to npm). |
| Copyright holder | Not stated anywhere except the `author` field above, which is not a verified legal owner. See [COPYRIGHT.md](./COPYRIGHT.md). |
| Licence of original source | **Undecided: owner decision required.** |

Nothing in `package.json` was changed when this file was written. If the owner decides on a licence, `package.json` `"license"` MUST be updated to match (or set to `"UNLICENSED"` for proprietary code), so the metadata does not contradict the chosen terms.

## 2. Decision required from the project owner

Record the decision below by editing this section (and, if applicable, adding the licence text). Do not infer it from this document.

- [ ] **Proprietary / all rights reserved.** Choose this if the code is not to be shared. No licence text is needed; state the owner in [COPYRIGHT.md](./COPYRIGHT.md) and set `package.json` to `"license": "UNLICENSED"`.
- [ ] **Open-source licence.** Choose a specific licence (for example a permissive one or a copyleft one), copy its **complete official text** and the copyright line into this file or a conventional `LICENSE` file, and confirm that every bundled third-party component allows it (see [section 4](#4-third-party-components)). Permissive and copyleft licences have very different obligations; take advice if unsure.
- [ ] **Source-available / dual licence.** If the owner wants something between these, a lawyer should draft the terms.

**Decision:** _not yet made_ · **Decided by:** _not recorded_ · **Date:** _not recorded_

### Filename note

The requested filename is `LICENSE.md`. Many tools (GitHub's licence detection, package registries and compliance scanners) recognise `LICENSE.md` as well as `LICENSE`, but this has not been verified for every tool the project may use. If a chosen licence requires the conventional `LICENSE` filename for some tool, discuss it first rather than silently adding a second file, so the two cannot diverge. Until a real licence exists, this status document is the only licensing file.

## 3. What a licence for the code would and would not cover

A licence on the **original application source** (the code written for this project under `src/`, infrastructure and tests) does **not** cover the following, which have their own owners and terms:

| Category | Who owns / licenses it | Notes |
|---|---|---|
| Original application source code | The project owner (to be confirmed) | The only thing this file's decision governs. |
| Open-source dependencies (npm) | Their authors, under their own licences | Obligations (notices, attribution) continue to apply. See [section 4](#4-third-party-components). |
| UI sources copied into the repo (shadcn/ui, Aceternity UI, Magic UI) | Their authors | Adapted under `src/components/ui/`. Their licence terms follow the copied code. |
| Fonts and icons | Their authors | Figtree and Geist Mono (Google Fonts via `next/font`, expected to be under the SIL Open Font License; confirm), Lucide (ISC). |
| Film and television artwork, posters, backdrops, logos | Rights holders; delivered through TMDB | Owning the application code gives **no** right to copy, redistribute or sell this artwork. |
| Trailers and other video | Rights holders; embedded from YouTube | Subject to YouTube's terms and the rights holders' terms. |
| Film and television content | Rights holders | This project does not host or stream full-length content. Distributing such content requires separate rights agreements. |
| Metadata and API data | TMDB | Subject to TMDB's API terms, including attribution; see [COPYRIGHT.md](./COPYRIGHT.md). |
| Names, logos and trademarks | Their owners | Third-party marks (TMDB, YouTube, Supabase, Vercel, Resend, etc.) belong to those owners. The "British Streaming" name has no verified trademark registration. |

Owning or licensing the code never implies rights over third-party media.

## 4. Third-party components

Licence identifiers below were read from each package's `package.json` in `node_modules` on 3 November 2026 and describe the installed versions. They are **not** legal advice; re-check on upgrade (`npx license-checker` or equivalent) and read each package's own licence file.

### 4.1 Declared dependencies (selected)

| Package | Version | Declared licence |
|---|---|---|
| `react`, `react-dom` | 19.2.8 | MIT |
| `next` | 16.3.4 | MIT |
| `motion` | 14.9.0 | MIT |
| `@base-ui/react` | 1.8.0 | MIT |
| `radix-ui` | 1.6.7 | MIT |
| `embla-carousel-react` | 8.6.0 | MIT |
| `tailwindcss` | 4.3.3 | MIT |
| `shadcn` (CLI) | 4.21.0 | MIT |
| `jose` | 6.2.15 | MIT |
| `@node-rs/argon2` | 2.2.2 | MIT |
| `@supabase/supabase-js` | 2.115.0 | MIT |
| `simplex-noise` | 4.0.3 | MIT |
| `sonner`, `cmdk`, `next-themes`, `tw-animate-css`, `zod`, `@tanstack/react-table`, `date-fns` | various | MIT |
| `lucide-react` | 1.48.0 | ISC |
| `class-variance-authority` | 0.7.1 | Apache-2.0 |
| `@playwright/test`, `typescript` (dev) | 1.64.1 / 5.9.3 | Apache-2.0 |
| `@animate-ui/react` | 2.4.1 | **MIT + Commons Clause** (custom; see below) |
| `@nova-design-system/nova-react` | 3.38.0 | **Custom EULA** (see below) |

### 4.2 Items that need the owner's attention

1. **`@animate-ui/react`: MIT with a Commons Clause condition.** Its `LICENSE.md` permits use "as part of an application, website, or product" and prohibits selling or redistributing the components **themselves** in their original form, alone or in a bundle. Using it inside British Streaming is within its stated terms; **extracting these components into a template, kit or library for sale or redistribution is not**. Keep its copyright notice (Elliot Sutton, 2025) with any redistribution that includes it. This also constrains whichever licence is chosen for the project: the project's own licence cannot grant others the right to redistribute Animate UI components standalone.
2. **`@nova-design-system/nova-react`: restrictive EULA.** It is declared in `package.json` but **no file under `src/` imports it** (checked by search). Its EULA is between Elia Group NV and "Subsidiaries, Partners or Affiliates", and states that parties outside that group cannot enter into it. Unless the owner confirms eligibility, the safe action is to **remove the unused dependency**. This file does not remove it; that is the owner's call.
3. **Copied UI sources.** `src/components/ui/` contains adapted sources from shadcn/ui, Aceternity UI (wavy background, hero parallax, card hover effect, infinite moving cards, floating dock) and Magic UI (shine border, interactive hover button). Their licence texts are **not recorded in this repository**. Confirm each one at its source, record it here, and keep any required notice. Do not assume the terms.
4. **Fonts.** Figtree and Geist Mono are loaded from Google Fonts through `next/font`, which self-hosts them at build time. Confirm the font licences (commonly the SIL Open Font License) and keep any required notices.

### 4.3 Transitive dependencies

The full dependency tree is larger than the table above (see `package-lock.json`). Generate a complete third-party notice file before any public release or distribution of a bundle or container image, because several licences require their notices to accompany distributions.

## 5. If an open-source licence is authorised

1. Record the decision in [section 2](#2-decision-required-from-the-project-owner).
2. Insert the **complete official licence text** exactly as published by the licence steward (do not paraphrase or shorten) together with the copyright line `Copyright (c) <year> <verified legal owner>`.
3. Confirm compatibility with every bundled component (especially the Commons Clause item and any copied UI sources), and that the licence does not contradict the third-party media position in [section 3](#3-what-a-licence-for-the-code-would-and-would-not-cover).
4. Update `package.json` `"license"`, [README.md](./README.md#licence-and-copyright) and [COPYRIGHT.md](./COPYRIGHT.md).
5. Preserve all upstream notices and licence conditions of third-party code.

## 6. Review triggers

Review this file when: a licence decision is made; the owner or contributors change; a dependency is added or upgraded; copied UI sources are added; any licensed media is hosted by the project; the project is distributed or published.

Legal review is recommended before any public release.
