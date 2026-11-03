# Copyright and Attribution

Ownership, attribution and content-rights notes for British Streaming. **This is an engineering reference, not legal advice and not a published copyright policy.** It must be reviewed by a qualified lawyer before any definitive policy is published or relied on.

Related: [LICENSE.md](./LICENSE.md) (licensing status) · [README.md](./README.md)

## 1. Platform and notice

| Item | Value |
|---|---|
| Platform | British Streaming |
| Copyright year | 2026 (first commits and this documentation are dated 2026) |
| Copyright holder | **[Verified Legal Owner: to be supplied]** |

The only name on record in the repository is `"author": "Dominic Wokorach"` in `package.json`, which is set by `npm init` style metadata and is **not** a verified legal owner (a person, a company, or an employer may hold the rights). The owner must confirm who holds copyright before the notice below is used publicly.

Configurable notice format:

```text
© 2026 [Verified Legal Owner]. All rights reserved.
```

Do not publish the notice, and do not assert exclusive rights, until the owner and the licensing position ([LICENSE.md](./LICENSE.md)) are confirmed.

> **Current UI behaviour to review.** The site footer (`src/components/layout/footer.tsx`) renders `© <current year> British Streaming. All rights reserved.` using the brand name, not a legal owner, and it asserts "all rights reserved" before a licence decision exists. Replace the holder with the verified legal owner (and decide the wording) when it is known.

## 2. Application code

- The original application code (`src/`, `tests/`, `infra/`, `.github/`, `monitoring/`, `docs/` and project configuration) was written for this project. **Who owns it has not been verified**: it depends on who commissioned or employed its authors and on any assignment agreements. State the verified owner here once known.
- The licence under which others may use that code is **undecided**; see [LICENSE.md](./LICENSE.md). Until a licence is recorded, no permission to copy or reuse the code is granted.
- Code produced with AI coding assistants is part of this repository. Whether and how copyright applies to such output depends on jurisdiction and circumstances; obtain legal advice and do not make claims about it in public notices.
- Contributor terms (for example a contributor licence agreement) have not been defined. Define them before accepting outside contributions.

## 3. Third-party software

Third-party code keeps its own copyright and licence; using it does not transfer ownership, and its notices must be preserved. Licence identifiers were read from the installed packages on 3 November 2026; see [LICENSE.md](./LICENSE.md#4-third-party-components) for the table and the items needing a decision.

| Component | Role | Attribution notes |
|---|---|---|
| React, Next.js | Framework | MIT. Retain their copyright and permission notice when distributing source or bundles that include them (`node_modules/react/LICENSE`, `node_modules/next/license.md`). |
| shadcn/ui | Component patterns and CLI | The CLI (`shadcn`) is MIT. Component sources copied into `src/components/ui/` follow the upstream licence; confirm and record it. |
| Aceternity UI | Adapted components: wavy background, hero parallax, card hover effect, infinite moving cards, floating dock | Copied and adapted source. Its licence is **not recorded in the repository**: confirm at source and preserve any required credit. |
| Magic UI | Adapted components: shine border, interactive hover button | Copied and adapted source. Same: confirm and record the licence. |
| Motion | Animation | MIT. |
| Animate UI (`@animate-ui/react`) | UI primitives | **MIT + Commons Clause** (Copyright (c) 2025 Elliot Sutton). Use inside the application is permitted; selling or redistributing the components themselves is not. Keep the notice with any redistribution. |
| Lucide React | Icons | ISC (parts derived from Feather under MIT). Keep the notice when distributing. |
| Base UI, Radix UI, Embla, Tailwind CSS, jose, Zod, Supabase JS, others | Libraries | Declared MIT (a few Apache-2.0); see `LICENSE.md`. |
| Fonts: Figtree, Geist Mono | Typography via Google Fonts | Confirm the font licences (commonly SIL Open Font License) and keep required notices. |

Before distributing a build, container image or source bundle, generate a **complete third-party notices file** from `package-lock.json`; many licences require their notices to accompany distributions.

## 4. Streaming media and metadata

British Streaming displays information, artwork and trailers that belong to other people.

- **Films and television programmes** are protected by copyright. This project does not host, stream or redistribute full-length titles. Distributing such content would require rights agreements that do not exist in this repository.
- **Posters, backdrops, logos and stills** are supplied through the TMDB image service. They may be subject to the rights holders' terms and to TMDB's terms of use. They are shown to describe titles in the catalogue; they are not licensed to the project for any other purpose, and the project's own licence never covers them.
- **Trailers** are embedded from YouTube (`youtube-nocookie` iframes) and are subject to YouTube's terms and the rights holders' terms. The project does not copy or re-host them.
- **Metadata** (titles, synopses, ratings, cast) comes from the TMDB API. TMDB's terms ask API users to display an attribution and non-endorsement statement. **The application does not currently display one** (no TMDB credit appears in the UI; the only `TMDB` references in components are internal). Verify the current TMDB terms and add the required notice, for example in the footer or an About page, before launch.
- **Third-party trademarks** (TMDB, YouTube, Supabase, Vercel, Resend, Netflix and every film or programme title and logo) belong to their respective owners. Their appearance here implies no endorsement or affiliation.
- Artwork and video must only be used as permitted by the applicable agreements. If the project ever hosts licensed media, record each agreement's scope (territory, term, format) in the rights register below.

## 5. Branding

- **Name:** "British Streaming". **Wordmark:** the name set in text with a blue-to-purple gradient (`src/lib/brand.ts`, navbar and auth screens). **Palette:** see [STYLING.md](./STYLING.md#colour-tokens).
- No logo image, trademark application or registration is recorded in the repository, and **no trademark claim is made here**. Do not use the symbols (R) or a registered-trademark statement unless a registration is verified.
- Clearance of the name "British Streaming" (whether it conflicts with existing marks) has not been checked in this repository. Seek advice before relying on the name commercially.
- Legacy identifiers (`netchannel`, `worldstreaming`) remain in non-user-facing places (package name, JWT issuer, infrastructure names). They are technical identifiers, not branding.

## 6. Rights register (to be completed by the owner)

| Asset or content | Rights holder | Licence or agreement | Scope (territory, term) | Evidence location |
|---|---|---|---|---|
| Application source | [to be confirmed] | [undecided, see LICENSE.md] | n/a | n/a |
| Brand name and wordmark | [to be confirmed] | n/a | n/a | n/a |
| TMDB metadata and images | TMDB and rights holders | TMDB API terms | Per TMDB | [link to accepted terms] |
| YouTube trailers | Rights holders | YouTube terms | Per YouTube | n/a |
| Hosted media (if ever added) | [to be confirmed] | [agreement] | [scope] | [location] |

## 7. Enquiries, takedown and legal correspondence

No contact details have been verified, so none are given here. Replace each placeholder only with real, monitored details.

| Purpose | Contact |
|---|---|
| Copyright enquiries | [copyright contact email: to be supplied] |
| Rights-holder contact | [rights-holder contact: to be supplied] |
| Content removal / takedown requests | [takedown contact and procedure: to be supplied] |
| Legal correspondence | [legal address / counsel: to be supplied] |

A takedown procedure (what a request must contain, how it is acknowledged, response times, counter-notice handling) must be drafted by counsel for the jurisdictions in which the service operates. The Terms & Conditions draft (`/legal/terms-and-conditions`) contains placeholders for the same legal contact and must be aligned with this file.

## 8. Review

This document requires **legal review before it is published as a policy**. Review it when ownership, licensing, third-party components, hosted content, or the TMDB/YouTube terms change.
