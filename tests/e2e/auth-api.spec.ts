import { expect, request as pwRequest, test } from "@playwright/test";
import { decodeJwt, decodeProtectedHeader, SignJWT } from "jose";
import { mailsFor, PASSWORD, registerAndVerify, setCookieValue, signInApi, tokenFrom, uniqueEmail, uniqueIp, waitForMail } from "./helpers";

const SECRET = new TextEncoder().encode("e2e-secret-e2e-secret-e2e-secret-0123456789");
const cookie = (at?: string, rt?: string) => [at && `ws_at=${at}`, rt && `ws_rt=${rt}`].filter(Boolean).join("; ");

test.describe("registration and email verification", () => {
  test("registers, blocks sign-in until verified, then verifies once", async ({ request }) => {
    const email = uniqueEmail("reg");
    const ip = uniqueIp();
    const reg = await request.post("/api/auth/register", { data: { fullName: "Ada Lovelace", email, password: PASSWORD, acceptTerms: true }, headers: { "x-forwarded-for": ip } });
    expect(reg.status()).toBe(201);
    expect(await reg.json()).toEqual({ ok: true, data: { status: "verification_sent" } });

    const blocked = await signInApi(request, email);
    expect(blocked.status()).toBe(403);
    expect((await blocked.json()).error.code).toBe("email_not_verified");

    const mail = await waitForMail(request, email, "verify");
    expect(mail.link).toContain("/account/verify-email?token=");
    const token = tokenFrom(mail.link);
    expect((await request.post("/api/auth/verify-email", { data: { token } })).status()).toBe(200);
    const replay = await request.post("/api/auth/verify-email", { data: { token } });
    expect(replay.status()).toBe(400);
    expect((await replay.json()).error.code).toBe("invalid_token");
    expect((await signInApi(request, email)).status()).toBe(200);
  });

  test("rejects weak passwords, bad emails and missing terms with field errors", async ({ request }) => {
    const base = { fullName: "X", email: uniqueEmail(), password: PASSWORD, acceptTerms: true };
    const weak = await request.post("/api/auth/register", { data: { ...base, password: "short" } });
    expect(weak.status()).toBe(422);
    expect((await weak.json()).error.fields.password).toBeTruthy();
    const common = await request.post("/api/auth/register", { data: { ...base, password: "password123" } });
    expect(common.status()).toBe(422);
    expect((await request.post("/api/auth/register", { data: { ...base, email: "not-an-email" } })).status()).toBe(422);
    const terms = await request.post("/api/auth/register", { data: { ...base, acceptTerms: false } });
    expect(terms.status()).toBe(422);
    expect((await terms.json()).error.fields.acceptTerms).toBeTruthy();
  });

  test("duplicate registration creates no second account and reveals nothing", async ({ request }) => {
    const email = uniqueEmail("dup");
    const first = await request.post("/api/auth/register", { data: { fullName: "Original", email, password: PASSWORD, acceptTerms: true } });
    const second = await request.post("/api/auth/register", { data: { fullName: "Imposter", email, password: "another-long-password-9", acceptTerms: true } });
    expect(second.status()).toBe(first.status());
    expect(await second.json()).toEqual(await first.json());

    await waitForMail(request, email, "already_registered");
    const kinds = (await mailsFor(request, email)).map((m) => m.kind);
    expect(kinds.filter((k) => k === "verify")).toHaveLength(1);

    await request.post("/api/auth/verify-email", { data: { token: tokenFrom((await waitForMail(request, email, "verify")).link) } });
    expect((await signInApi(request, email, PASSWORD)).status()).toBe(200); // original credentials intact
    expect((await signInApi(request, email, "another-long-password-9")).status()).toBe(401); // imposter's did not take effect
  });

  test("resend verification is generic and only mails unverified accounts", async ({ request }) => {
    const email = uniqueEmail("resend");
    await request.post("/api/auth/register", { data: { fullName: "R", email, password: PASSWORD, acceptTerms: true } });
    await waitForMail(request, email, "verify");
    const res = await request.post("/api/auth/resend-verification", { data: { email } });
    const unknown = await request.post("/api/auth/resend-verification", { data: { email: uniqueEmail("ghost") } });
    expect(res.status()).toBe(202);
    expect(await unknown.json()).toEqual(await res.json());
    await waitForMail(request, email, "verify", { count: 2 });
  });
});

test.describe("sign-in and tokens", () => {
  test("issues HttpOnly cookies, never puts tokens in the body, with the configured JWT claims", async ({ request }) => {
    const { email } = await registerAndVerify(request);
    const res = await signInApi(request, email);
    expect(res.status()).toBe(200);
    const body = JSON.stringify(await res.json());
    expect(body).not.toMatch(/eyJ/); // no JWT in JSON
    expect(body).toContain(email);

    const raw = res.headersArray().filter((h) => h.name.toLowerCase() === "set-cookie").map((h) => h.value);
    const at = raw.find((c) => c.startsWith("ws_at="))!;
    const rt = raw.find((c) => c.startsWith("ws_rt="))!;
    for (const c of [at, rt]) { expect(c).toMatch(/HttpOnly/i); expect(c).toMatch(/SameSite=Lax/i); expect(c).toMatch(/Path=\//i); }
    expect(rt).not.toMatch(/Max-Age|Expires/i); // session cookie unless "remember me"

    const jwt = setCookieValue(res, "ws_at")!;
    expect(decodeProtectedHeader(jwt).alg).toBe("HS256");
    const claims = decodeJwt(jwt);
    expect(claims.iss).toBe("worldstreaming");
    expect(claims.aud).toBe("worldstreaming-web");
    expect(claims.exp! - claims.iat!).toBe(900); // 15 minutes
    expect(Object.keys(claims).sort()).toEqual(["aud", "exp", "iat", "iss", "jti", "role", "sid", "sub"]); // minimal claims, no email/PII
  });

  test("remember me issues a persistent refresh cookie", async ({ request }) => {
    const { email } = await registerAndVerify(request);
    const res = await signInApi(request, email, PASSWORD, uniqueIp(), true);
    const rt = res.headersArray().find((h) => h.name.toLowerCase() === "set-cookie" && h.value.startsWith("ws_rt="))!.value;
    expect(rt).toMatch(/Max-Age=2592000/i);
  });

  test("session survives across requests via /me, and an unknown user gets the same error as a wrong password", async ({ request }) => {
    const { email } = await registerAndVerify(request);
    expect((await signInApi(request, email)).status()).toBe(200);
    expect((await (await request.get("/api/auth/me")).json()).data.user.email).toBe(email);

    const wrong = await signInApi(request, email, "definitely-the-wrong-password", uniqueIp());
    const ghost = await signInApi(request, uniqueEmail("ghost"), "definitely-the-wrong-password", uniqueIp());
    expect(wrong.status()).toBe(401);
    expect(ghost.status()).toBe(401);
    expect(await ghost.json()).toEqual(await wrong.json()); // no account enumeration
  });

  test("brute force is throttled per email, even for the correct password", async ({ request }) => {
    const { email } = await registerAndVerify(request);
    const ip = uniqueIp();
    for (let i = 0; i < 8; i++) expect((await signInApi(request, email, "wrong-password-attempt", ip)).status()).toBe(401);
    const blocked = await signInApi(request, email, "wrong-password-attempt", ip);
    expect(blocked.status()).toBe(429);
    expect(Number(blocked.headers()["retry-after"])).toBeGreaterThan(0);
    expect((await signInApi(request, email, PASSWORD, ip)).status()).toBe(429);
  });

  test("a successful sign-in resets the failure counter", async ({ request }) => {
    const { email } = await registerAndVerify(request);
    for (let i = 0; i < 5; i++) await signInApi(request, email, "wrong-password-attempt");
    expect((await signInApi(request, email)).status()).toBe(200);
    for (let i = 0; i < 5; i++) expect((await signInApi(request, email, "wrong-password-attempt")).status()).toBe(401);
  });
});

test.describe("CSRF", () => {
  test("mutating requests need a same-origin Origin and the CSRF header", async ({ baseURL }) => {
    const bare = await pwRequest.newContext({ baseURL, extraHTTPHeaders: {} }); // explicit {} so project-level defaults are not inherited
    const data = { email: uniqueEmail(), password: PASSWORD };
    expect((await bare.post("/api/auth/sign-in", { data })).status()).toBe(403); // no Origin, no header
    expect((await bare.post("/api/auth/sign-in", { data, headers: { origin: baseURL!, } })).status()).toBe(403); // header missing
    expect((await bare.post("/api/auth/sign-in", { data, headers: { origin: "https://evil.example", "x-ws-csrf": "1" } })).status()).toBe(403); // foreign origin
    expect((await bare.post("/api/auth/sign-in", { data, headers: { origin: baseURL!, "x-ws-csrf": "1", "sec-fetch-site": "cross-site" } })).status()).toBe(403);
    expect((await bare.post("/api/auth/sign-out", { data: {} })).status()).toBe(403);
    expect((await bare.post("/api/auth/sign-in", { data, headers: { origin: baseURL!, "x-ws-csrf": "1" } })).status()).toBe(401); // passes CSRF, fails credentials
    await bare.dispose();
  });
});

test.describe("JWT validation on protected endpoints", () => {
  const sign = (over: { iss?: string; aud?: string; exp?: number; sid?: string; alg?: "HS256" | "HS512" } = {}) =>
    new SignJWT({ sid: over.sid ?? crypto.randomUUID(), role: "admin" })
      .setProtectedHeader({ alg: over.alg ?? "HS256" })
      .setSubject(crypto.randomUUID())
      .setIssuer(over.iss ?? "worldstreaming")
      .setAudience(over.aud ?? "worldstreaming-web")
      .setIssuedAt()
      .setExpirationTime(over.exp ?? "5m")
      .sign(SECRET);

  test("rejects missing, forged, wrong-issuer, wrong-audience, wrong-algorithm, expired and unsigned tokens", async ({ playwright, baseURL }) => {
    const anon = await playwright.request.newContext({ baseURL });
    const get = (jwt?: string) => anon.get("/api/auth/me", { headers: jwt ? { cookie: cookie(jwt) } : {} });

    expect((await get()).status()).toBe(401);
    expect((await get(await sign())).status()).toBe(401); // perfectly signed, but no such session: signature alone is not enough
    expect((await get(await sign({ iss: "someone-else" }))).status()).toBe(401);
    expect((await get(await sign({ aud: "other-app" }))).status()).toBe(401);
    expect((await get(await sign({ alg: "HS512" }))).status()).toBe(401);
    const expired = await get(await sign({ exp: Math.floor(Date.now() / 1000) - 60 }));
    expect(expired.status()).toBe(401);
    expect((await expired.json()).error.code).toBe("session_expired");

    const unsigned = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString("base64url")}.${Buffer.from(JSON.stringify({ sub: "x", sid: crypto.randomUUID(), iss: "worldstreaming", aud: "worldstreaming-web", exp: 9999999999 })).toString("base64url")}.`;
    expect((await get(unsigned)).status()).toBe(401);
    expect((await get("garbage")).status()).toBe(401);
    await anon.dispose();
  });

  test("a tampered real token and a token whose session was revoked are both refused", async ({ request, playwright, baseURL }) => {
    const { email } = await registerAndVerify(request);
    const res = await signInApi(request, email);
    const jwt = setCookieValue(res, "ws_at")!;
    const other = await playwright.request.newContext({ baseURL });
    expect((await other.get("/api/auth/me", { headers: { cookie: cookie(jwt) } })).status()).toBe(200);
    const tampered = jwt.slice(0, -3) + (jwt.endsWith("AAA") ? "BBB" : "AAA");
    expect((await other.get("/api/auth/me", { headers: { cookie: cookie(tampered) } })).status()).toBe(401);
    await request.post("/api/auth/sign-out", { data: {} });
    expect((await other.get("/api/auth/me", { headers: { cookie: cookie(jwt) } })).status()).toBe(401); // JWT still unexpired, session is revoked
    await other.dispose();
  });

  test("user-data endpoints require authentication server-side", async ({ request }) => {
    for (const path of ["/api/me/list", "/api/me/reactions", "/api/me/progress", "/api/me/history", "/api/auth/sessions"]) {
      expect((await request.get(path)).status(), path).toBe(401);
    }
    expect((await request.post("/api/me/list", { data: { tmdbId: 1, mediaType: "movie" } })).status()).toBe(401);
    expect((await request.post("/api/auth/sign-out-all", { data: {} })).status()).toBe(401);
  });
});

test.describe("refresh rotation and sign-out", () => {
  test("refresh rotates the refresh token and keeps the session alive", async ({ request }) => {
    const { email } = await registerAndVerify(request);
    const first = await signInApi(request, email);
    const r1 = setCookieValue(first, "ws_rt")!;
    const refreshed = await request.post("/api/auth/refresh", { data: {} });
    expect(refreshed.status()).toBe(200);
    const r2 = setCookieValue(refreshed, "ws_rt")!;
    expect(r2).toBeTruthy();
    expect(r2).not.toBe(r1);
    expect(r2.split(".")[0]).toBe(r1.split(".")[0]); // same session id, new secret
    expect((await request.get("/api/auth/me")).status()).toBe(200);
  });

  test("replaying an old refresh token inside the race window is a conflict, not a revocation", async ({ request, playwright, baseURL }) => {
    const { email } = await registerAndVerify(request);
    const r1 = setCookieValue(await signInApi(request, email), "ws_rt")!;
    expect((await request.post("/api/auth/refresh", { data: {} })).status()).toBe(200);
    const stale = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { origin: baseURL!, "x-ws-csrf": "1" } });
    const replay = await stale.post("/api/auth/refresh", { data: {}, headers: { cookie: cookie(undefined, r1) } });
    expect(replay.status()).toBe(409);
    expect((await request.get("/api/auth/me")).status()).toBe(200); // legitimate session unaffected
    await stale.dispose();
  });

  test("sign-out revokes the session, clears cookies, and the old refresh token is dead", async ({ request, playwright, baseURL }) => {
    const { email } = await registerAndVerify(request);
    const r1 = setCookieValue(await signInApi(request, email), "ws_rt")!;
    const out = await request.post("/api/auth/sign-out", { data: {} });
    expect(out.status()).toBe(200);
    const cleared = out.headersArray().filter((h) => h.name.toLowerCase() === "set-cookie").map((h) => h.value);
    expect(cleared.some((c) => c.startsWith("ws_at=;") && /Max-Age=0/i.test(c))).toBe(true);
    expect(cleared.some((c) => c.startsWith("ws_rt=;") && /Max-Age=0/i.test(c))).toBe(true);
    expect((await request.get("/api/auth/me")).status()).toBe(401);
    const stale = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { origin: baseURL!, "x-ws-csrf": "1" } });
    expect((await stale.post("/api/auth/refresh", { data: {}, headers: { cookie: cookie(undefined, r1) } })).status()).toBe(401);
    await stale.dispose();
  });

  test("sign-out-all revokes every device; sessions can be listed and revoked individually", async ({ playwright, baseURL, request }) => {
    const { email } = await registerAndVerify(request);
    const make = () => playwright.request.newContext({ baseURL, extraHTTPHeaders: { origin: baseURL!, "x-ws-csrf": "1" } });
    const [a, b, c] = await Promise.all([make(), make(), make()]);
    for (const ctx of [a, b, c]) expect((await signInApi(ctx, email)).status()).toBe(200);

    const list = await (await a.get("/api/auth/sessions")).json();
    expect(list.data.sessions).toHaveLength(3);
    expect(list.data.sessions.filter((s: { current: boolean }) => s.current)).toHaveLength(1);

    const other = list.data.sessions.find((s: { current: boolean }) => !s.current);
    expect((await a.delete(`/api/auth/sessions/${other.id}`)).status()).toBe(200);
    expect((await a.delete(`/api/auth/sessions/${crypto.randomUUID()}`)).status()).toBe(404); // unknown / not yours

    expect((await a.post("/api/auth/sign-out-all", { data: {} })).status()).toBe(200);
    for (const ctx of [a, b, c]) expect((await ctx.get("/api/auth/me")).status()).toBe(401);
    for (const ctx of [a, b, c]) await ctx.dispose();
  });
});

test.describe("forgot and reset password", () => {
  test("forgot-password answers identically for known and unknown emails, and only mails real accounts", async ({ request }) => {
    const { email } = await registerAndVerify(request);
    const ghost = uniqueEmail("ghost");
    const known = await request.post("/api/auth/forgot-password", { data: { email }, headers: { "x-forwarded-for": uniqueIp() } });
    const unknown = await request.post("/api/auth/forgot-password", { data: { email: ghost }, headers: { "x-forwarded-for": uniqueIp() } });
    expect(known.status()).toBe(202);
    expect(unknown.status()).toBe(202);
    expect(await unknown.json()).toEqual(await known.json());

    const mail = await waitForMail(request, email, "reset");
    expect(mail.link).toMatch(/\/account\/reset-password\?token=[\w-]{40,}/);
    expect(await mailsFor(request, ghost)).toHaveLength(0);
  });

  test("forgot-password is rate limited per email", async ({ request }) => {
    const email = uniqueEmail("rl");
    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) statuses.push((await request.post("/api/auth/forgot-password", { data: { email }, headers: { "x-forwarded-for": uniqueIp() } })).status());
    expect(statuses).toEqual([202, 202, 202, 429, 429]);
  });

  test("invalid and malformed reset tokens are rejected", async ({ request }) => {
    const bogus = await request.post("/api/auth/reset-password", { data: { token: "x".repeat(43), password: "a-brand-new-password-1" } });
    expect(bogus.status()).toBe(400);
    expect((await bogus.json()).error.code).toBe("invalid_token");
    expect((await request.post("/api/auth/reset-password", { data: { token: "short", password: "a-brand-new-password-1" } })).status()).toBe(422);
  });

  test("reset changes the password, is single-use, revokes sessions, notifies, and does NOT sign the user in", async ({ request, playwright, baseURL }) => {
    const { email } = await registerAndVerify(request);
    const device = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { origin: baseURL!, "x-ws-csrf": "1" } });
    expect((await signInApi(device, email)).status()).toBe(200);

    await request.post("/api/auth/forgot-password", { data: { email } });
    const first = tokenFrom((await waitForMail(request, email, "reset")).link);
    await request.post("/api/auth/forgot-password", { data: { email } });
    const second = tokenFrom((await waitForMail(request, email, "reset", { count: 2 })).link);

    const weak = await request.post("/api/auth/reset-password", { data: { token: first, password: "short" } });
    expect(weak.status()).toBe(422); // a rejected password must not burn the token

    const NEW = "a-brand-new-password-1";
    const done = await request.post("/api/auth/reset-password", { data: { token: first, password: NEW } });
    expect(done.status()).toBe(200);
    expect(done.headersArray().some((h) => h.name.toLowerCase() === "set-cookie")).toBe(false);

    expect((await request.post("/api/auth/reset-password", { data: { token: first, password: "another-password-22" } })).status()).toBe(400); // single use
    expect((await request.post("/api/auth/reset-password", { data: { token: second, password: "another-password-22" } })).status()).toBe(400); // sibling token voided
    expect((await device.get("/api/auth/me")).status()).toBe(401); // existing session revoked

    expect((await signInApi(request, email, PASSWORD)).status()).toBe(401);
    expect((await signInApi(request, email, NEW)).status()).toBe(200);
    await waitForMail(request, email, "password_changed");
    await device.dispose();
  });
});

test("authentication events are written to the audit log", async ({ request }) => {
  const { email } = await registerAndVerify(request);
  await signInApi(request, email, "wrong-password-attempt");
  await signInApi(request, email);
  const userId = (await (await request.get("/api/auth/me")).json()).data.user.id as string;
  await request.post("/api/auth/sign-out", { data: {} });
  const { audit } = (await (await request.get("/api/dev/outbox?audit=1")).json()) as { audit: Array<{ event: string; userId?: string }> };
  const events = audit.filter((e) => e.userId === userId).map((e) => e.event);
  for (const expected of ["register", "email_verified", "sign_in_failed", "sign_in", "sign_out"]) expect(events, expected).toContain(expected);
  expect(JSON.stringify(audit)).not.toContain(PASSWORD); // no secrets in the log
});
