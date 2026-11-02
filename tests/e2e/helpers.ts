import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const PASSWORD = "correct-horse-battery";
let counter = 0;
export const uniqueEmail = (tag = "user") => `${tag}-${Date.now().toString(36)}-${(counter++).toString(36)}-${Math.random().toString(36).slice(2, 6)}@example.com`;
/** Each test gets its own "client IP" so per-IP rate limits never couple unrelated tests. */
export const uniqueIp = () => `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;

interface Mail { to: string; kind: string; link?: string; subject: string }

/** Polls the dev-only outbox (emails are sent after the response, so they arrive slightly later). */
export async function waitForMail(request: APIRequestContext, to: string, kind: string, opts: { count?: number } = {}): Promise<Mail> {
  const want = opts.count ?? 1;
  let found: Mail[] = [];
  await expect.poll(async () => {
    const res = await request.get(`/api/dev/outbox?to=${encodeURIComponent(to)}`);
    found = ((await res.json()) as { messages: Mail[] }).messages.filter((m) => m.kind === kind);
    return found.length;
  }, { timeout: 10_000, message: `waiting for ${kind} email to ${to}` }).toBeGreaterThanOrEqual(want);
  return found[want - 1];
}
export async function mailsFor(request: APIRequestContext, to: string): Promise<Mail[]> {
  return ((await (await request.get(`/api/dev/outbox?to=${encodeURIComponent(to)}`)).json()) as { messages: Mail[] }).messages;
}
export const tokenFrom = (link: string | undefined) => new URL(link!).searchParams.get("token")!;

export async function registerAndVerify(request: APIRequestContext, email = uniqueEmail(), password = PASSWORD, ip = uniqueIp()) {
  const reg = await request.post("/api/auth/register", { data: { fullName: "Test User", email, password, acceptTerms: true }, headers: { "x-forwarded-for": ip } });
  expect(reg.status()).toBe(201);
  const mail = await waitForMail(request, email, "verify");
  const ver = await request.post("/api/auth/verify-email", { data: { token: tokenFrom(mail.link) }, headers: { "x-forwarded-for": ip } });
  expect(ver.status()).toBe(200);
  return { email, password, ip };
}

export async function signInApi(request: APIRequestContext, email: string, password = PASSWORD, ip = uniqueIp(), remember = false) {
  return request.post("/api/auth/sign-in", { data: { email, password, remember }, headers: { "x-forwarded-for": ip } });
}

/** Pulls a cookie's raw value out of a response's Set-Cookie headers. */
export function setCookieValue(res: { headersArray(): { name: string; value: string }[] }, name: string): string | undefined {
  for (const h of res.headersArray()) if (h.name.toLowerCase() === "set-cookie" && h.value.startsWith(`${name}=`)) return h.value.split(";")[0].slice(name.length + 1);
  return undefined;
}

/** Fills the UI sign-in form and submits. */
export async function uiSignIn(page: Page, email: string, password = PASSWORD) {
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
}

import { request as pwRequest } from "@playwright/test";
/** API client with the Origin + CSRF headers a real browser page would send (device projects don't set them globally). */
export const apiContext = (baseURL: string) => pwRequest.newContext({ baseURL, extraHTTPHeaders: { origin: new URL(baseURL).origin, "x-ws-csrf": "1" } });
export const BASE = () => process.env.E2E_BASE_URL ?? `http://127.0.0.1:${process.env.E2E_PORT ?? 3210}`;
