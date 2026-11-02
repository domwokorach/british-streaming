# Authentication

Custom JWT authentication on the existing stack (Next.js route handlers + the project's Supabase Postgres). Supabase **Auth** is no longer used; Supabase is only the database.

## How it works

| Piece | Design |
|---|---|
| Access token | JWT, **HS256 pinned**, 15 min, `iss`/`aud` configurable, claims `sub`, `sid`, `role` only. In an HttpOnly cookie. |
| Refresh token | 256-bit random, opaque (`<sessionId>.<secret>`), HttpOnly cookie. Only `sha256(secret)` is stored. **Rotated on every refresh.** |
| Reuse detection | Presenting an already-rotated token inside `AUTH_REFRESH_GRACE_SECONDS` (default 10 s, multi-tab race) returns 409 and changes nothing; after that the whole session is revoked and `refresh_reuse_detected` is audited. |
| Revocation | Every protected request checks the JWT **and** the live session row, so sign-out, sign-out-all, password reset and "revoke this device" take effect immediately, not after the JWT expires. |
| Passwords | Argon2id (19 MiB, t=2, p=1). Policy: ≥10 chars, not common, no email name. Unknown-email sign-ins burn an equal hash to avoid timing leaks. |
| Email links | 256-bit tokens, hashed at rest, single-use, atomic (Postgres functions). Reset 30 min, verify 24 h (configurable). |
| Reset | Consumes the token, changes the password, voids sibling tokens and revokes **all** sessions in one transaction. It never signs the user in. A "password changed" email is sent. |
| Enumeration | register / forgot / resend always return the same response. Duplicate registration emails the existing owner instead. Sign-in failures are one generic message. Email work happens after the response is sent. |
| Rate limits | Postgres counters (shared across instances): per-IP and per-email on sign-in (8 failures/15 min per email), forgot, register, resend. Success resets the email counter. |
| CSRF | State-changing requests need a same-origin `Origin`, a non-cross-site `Sec-Fetch-Site`, and `x-ws-csrf: 1`; cookies are also `SameSite=Lax`. |
| Cookies | `HttpOnly`, `Secure` + `__Host-` prefix on HTTPS/production, `SameSite=Lax`. Refresh cookie is a session cookie unless "Remember me" (30 d). Nothing is ever put in localStorage/sessionStorage. |
| Routes | `proxy.ts` guards pages (`/browse`, `/my-list`, `/watch-history`, `/account/profile`, `/account/settings`); an expired access token with a valid refresh cookie is renewed via `/account/session-refresh`. This is UX only: every API re-checks server-side. `next=` is validated by `safeNext` (no open redirects). |
| Audit | `auth_audit_log`: register, sign_in, sign_in_failed, token_refreshed, refresh_reuse_detected, sign_out(_all), password_reset(_requested/_failed), email_verified, rate_limited … No secrets or raw emails in metadata. |

## Setup

1. **Apply the migration** `supabase/migrations/20260915000000_custom_jwt_auth.sql` (`supabase db push`, or paste it in the SQL editor).
   ⚠ It deletes all rows in `my_list`, `watch_progress`, `viewing_history`, `reactions`, `recent_searches`, `preferences` (they belonged to Supabase-Auth users and cannot satisfy the new foreign key), drops `profiles`, and enables RLS with no policies so the browser can read nothing directly.
2. Set `SUPABASE_SECRET_KEY` (service role) and `NEXT_PUBLIC_SUPABASE_URL`. **The server uses the service role for all auth and user-data queries; every query is scoped by the verified user id.**
3. Set `AUTH_JWT_SECRET` (`openssl rand -base64 48`) and `APP_URL` (public origin, **runtime** variable, used for CSRF and email links).
4. Email: set `RESEND_API_KEY` and `MAIL_FROM` (verified sender domain). Without a key, development prints the link to the server log; production sends nothing.
5. Create an admin (no UI): `update public.users set role = 'admin' where email = '…';`

All variables: `.env.example`. In AWS they come from Secrets Manager (`infra/terraform/envs/*/terraform.tfvars.example`).

## Tests

`npm run build && npm run test:e2e` runs the real production build against an in-memory store (`AUTH_STORE=memory` + `AUTH_UNSAFE_TEST_MODE=1`, accepted only when `APP_URL` is loopback). A second server with 2 s tokens covers expiry, rotation and reuse.
Covered: registration, duplicate registration, verification, valid/invalid login, brute force, CSRF, JWT forgery (wrong iss/aud/alg, unsigned, tampered, expired), rotation + reuse, logout, sign-out-all, per-device revocation, forgot/reset (single-use, expiry, revocation, notification), protected pages and APIs, open redirects, and the UI flows on desktop, iPhone, Android and iPad profiles.

**Not covered by automated tests:** the Supabase store and the SQL functions (they need a real database), and real email delivery. Run the API suite once against a staging deployment with the Supabase store before launch.

## Known limitations

- Access tokens are HS256 (shared secret). Rotating `AUTH_JWT_SECRET` signs everyone out; add `kid`-based key rotation or move to EdDSA if you need zero-downtime rotation.
- No MFA, no social login, no account deletion/email-change flows.
- Rate-limit keys use the right-most `X-Forwarded-For` entry; that is correct behind one trusted proxy (the ALB) and must be revisited if a CDN is added in front.
- Realtime cross-device updates were replaced by refetch-on-focus and cross-tab `BroadcastChannel`; a different device sees changes when it regains focus.
