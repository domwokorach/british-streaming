import { expect, test } from "@playwright/test";
import { PASSWORD, registerAndVerify, setCookieValue, signInApi, tokenFrom, uniqueIp, waitForMail } from "./helpers";

// Runs against a server configured with a 2 s access token, 1 s refresh-race window and 2 s reset links.
const cookie = (rt: string) => `ws_rt=${rt}`;

test("an expired access token is rejected, then a refresh restores the session", async ({ request }) => {
  const { email } = await registerAndVerify(request);
  const jwt = setCookieValue(await signInApi(request, email), "ws_at")!;
  expect((await request.get("/api/auth/me")).status()).toBe(200);

  await new Promise((r) => setTimeout(r, 3200)); // JWT lifetime is 2 s
  // Browsers drop the cookie at expiry, so the jar sends nothing...
  expect((await request.get("/api/auth/me")).status()).toBe(401);
  // ...and a client that still presents the expired JWT is told so explicitly (signature valid, `exp` passed).
  const expired = await request.get("/api/auth/me", { headers: { cookie: `ws_at=${jwt}` } });
  expect(expired.status()).toBe(401);
  expect((await expired.json()).error.code).toBe("session_expired");

  expect((await request.post("/api/auth/refresh", { data: {} })).status()).toBe(200);
  expect((await request.get("/api/auth/me")).status()).toBe(200);
});

test("reusing a rotated refresh token after the race window revokes the whole session", async ({ request, playwright, baseURL }) => {
  const { email } = await registerAndVerify(request);
  const r1 = setCookieValue(await signInApi(request, email), "ws_rt")!;
  const rotated = await request.post("/api/auth/refresh", { data: {} });
  expect(rotated.status()).toBe(200);
  const r2 = setCookieValue(rotated, "ws_rt")!;

  await new Promise((r) => setTimeout(r, 1500)); // past the 1 s grace window: this is theft, not a second tab
  const attacker = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { origin: baseURL!, "x-ws-csrf": "1" } });
  const replay = await attacker.post("/api/auth/refresh", { data: {}, headers: { cookie: cookie(r1) } });
  expect(replay.status()).toBe(401);

  // The legitimate holder of r2 is logged out too: the token family is burned.
  expect((await attacker.post("/api/auth/refresh", { data: {}, headers: { cookie: cookie(r2) } })).status()).toBe(401);
  expect((await request.post("/api/auth/refresh", { data: {} })).status()).toBe(401);
  expect((await request.get("/api/auth/me")).status()).toBe(401);

  const { audit } = (await (await request.get("/api/dev/outbox?audit=1")).json()) as { audit: Array<{ event: string }> };
  expect(audit.some((e) => e.event === "refresh_reuse_detected")).toBe(true);
  await attacker.dispose();
});

test("an expired reset link is refused", async ({ request }) => {
  const { email } = await registerAndVerify(request);
  await request.post("/api/auth/forgot-password", { data: { email }, headers: { "x-forwarded-for": uniqueIp() } });
  const token = tokenFrom((await waitForMail(request, email, "reset")).link);
  await new Promise((r) => setTimeout(r, 3200));
  const res = await request.post("/api/auth/reset-password", { data: { token, password: "a-brand-new-password-1" } });
  expect(res.status()).toBe(400);
  expect((await res.json()).error.code).toBe("invalid_token");
  expect((await signInApi(request, email, PASSWORD)).status()).toBe(200); // password unchanged
});
