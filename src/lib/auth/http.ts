import "server-only";

import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { authConfig, cookieNames } from "./config";
import { AuthError } from "./errors";
import { authenticate, type Authenticated, type ClientContext } from "./service";
import type { IssuedTokens } from "./service";
import type { Role } from "./tokens";

export const CSRF_HEADER = "x-ws-csrf";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (header ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
export const readCookie = (request: Request, name: string) => parseCookies(request.headers.get("cookie"))[name];
export const readAccessCookie = (r: Request) => readCookie(r, cookieNames.access);
export const readRefreshCookie = (r: Request) => readCookie(r, cookieNames.refresh);

/** Client IP. Behind our load balancer the RIGHT-most X-Forwarded-For entry is the one it appended; left entries are client-controlled. */
export function clientContext(request: Request): ClientContext {
  let ip = "unknown";
  const xff = request.headers.get("x-forwarded-for");
  if (xff && authConfig.trustProxy) ip = xff.split(",").at(-1)!.trim() || ip;
  else if (xff && process.env.NODE_ENV !== "production") ip = xff.split(",").at(-1)!.trim() || ip; // dev/test only: lets tests isolate rate-limit buckets
  return { ip: ip.slice(0, 64), userAgent: request.headers.get("user-agent") };
}

/**
 * CSRF defence for cookie-authenticated, state-changing requests (defence in depth on top of SameSite):
 *  1. Origin must be this app (missing Origin on a mutating request is refused),
 *  2. Sec-Fetch-Site, when sent, must not be cross-site,
 *  3. a custom header is required, which browsers only allow after a CORS preflight we never grant.
 */
export function assertCsrf(request: Request) {
  if (SAFE_METHODS.has(request.method)) return;
  const origin = request.headers.get("origin");
  const allowed = new Set([new URL(authConfig.appUrl).origin, ...(process.env.AUTH_EXTRA_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean)]);
  if (process.env.NODE_ENV !== "production") allowed.add(new URL(request.url).origin);
  const site = request.headers.get("sec-fetch-site");
  if (!origin || !allowed.has(origin) || site === "cross-site" || request.headers.get(CSRF_HEADER) !== "1") {
    throw new AuthError("csrf_failed", 403, "Request could not be verified.");
  }
}

export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new AuthError("bad_request", 415, "Expected application/json.");
  const text = await request.text();
  if (text.length > 16_384) throw new AuthError("bad_request", 413, "Request too large.");
  let json: unknown;
  try { json = JSON.parse(text); } catch { throw new AuthError("bad_request", 400, "Malformed JSON."); }
  return schema.parse(json);
}

export const ok = <T>(data: T, init?: ResponseInit) => NextResponse.json({ ok: true, data }, { ...init, headers: { "cache-control": "no-store", ...init?.headers } });

export function failResponse(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of error.issues) fields[String(issue.path[0] ?? "form")] ??= issue.message;
    return NextResponse.json({ ok: false, error: { code: "validation_failed", message: "Please check the highlighted fields.", fields } }, { status: 422, headers: { "cache-control": "no-store" } });
  }
  if (error instanceof AuthError) {
    const headers: Record<string, string> = { "cache-control": "no-store" };
    if (error.extra.retryAfterSeconds) headers["retry-after"] = String(error.extra.retryAfterSeconds);
    return NextResponse.json({ ok: false, error: { code: error.code, message: error.message, fields: error.extra.fields, retryAfterSeconds: error.extra.retryAfterSeconds } }, { status: error.status, headers });
  }
  // Never echo internals to the client; the structured log carries the detail.
  console.error(JSON.stringify({ level: "error", message: "auth_unhandled", error: error instanceof Error ? `${error.name}: ${error.message}` : "unknown" }));
  return NextResponse.json({ ok: false, error: { code: "internal_error", message: "Something went wrong. Please try again." } }, { status: 500, headers: { "cache-control": "no-store" } });
}

type Handler = (request: Request, ctx: ClientContext, ...rest: never[]) => Promise<Response>;

/** Central error handling + CSRF for every auth/user-data route. */
export function route(handler: Handler, options: { csrf?: boolean } = {}) {
  return async (request: Request): Promise<Response> => {
    try {
      if (options.csrf !== false) assertCsrf(request);
      return await handler(request, clientContext(request));
    } catch (error) {
      return failResponse(error);
    }
  };
}

/** Same, but requires a valid authenticated session (and optionally a role) before running. */
export function protectedRoute(handler: (request: Request, auth: Authenticated, ctx: ClientContext) => Promise<Response>, options: { role?: Role; csrf?: boolean } = {}) {
  return route(async (request, ctx) => {
    const auth = await authenticate(readAccessCookie(request));
    if (options.role && auth.role !== options.role) throw new AuthError("forbidden", 403, "You don't have permission to do that.");
    return handler(request, auth, ctx);
  }, options);
}

const cookieBase = () => ({ httpOnly: true as const, secure: authConfig.secureCookies, sameSite: "lax" as const, path: "/" });

export function setAuthCookies(res: NextResponse, tokens: IssuedTokens) {
  // Access cookie lives only as long as the JWT; refresh cookie is a session cookie unless "remember me".
  res.cookies.set(cookieNames.access, tokens.access, { ...cookieBase(), maxAge: authConfig.accessTtlSeconds });
  res.cookies.set(cookieNames.refresh, tokens.refresh, { ...cookieBase(), ...(tokens.persistent ? { maxAge: authConfig.rememberTtlSeconds } : {}) });
  return res;
}
export function clearAuthCookies(res: NextResponse) {
  for (const name of [cookieNames.access, cookieNames.refresh]) res.cookies.set(name, "", { ...cookieBase(), maxAge: 0 });
  return res;
}
