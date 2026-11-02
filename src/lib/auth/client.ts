"use client";

// Browser-side helpers. Tokens live in HttpOnly cookies the browser attaches itself; this code never
// sees, stores or sends a JWT. State-changing requests carry the CSRF header the server requires.

export interface ApiFailure { status: number; code: string; message: string; fields?: Record<string, string>; retryAfterSeconds?: number }
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiFailure };

let inflightRefresh: Promise<boolean> | null = null;

/** One refresh at a time across the page, so concurrent 401s don't race the rotating refresh token. */
export function refreshSession(): Promise<boolean> {
  inflightRefresh ??= (async () => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST", credentials: "same-origin", headers: { "x-ws-csrf": "1", "content-type": "application/json" }, body: "{}" });
      // Always consume the body: an unread response keeps the request "open" in the browser (and blocks network-idle).
      await res.body?.cancel();
      // 409 = another tab rotated first; the browser's shared cookie jar already holds the new tokens.
      return res.ok || res.status === 409;
    } catch {
      return false;
    } finally {
      setTimeout(() => { inflightRefresh = null; }, 0);
    }
  })();
  return inflightRefresh;
}

async function once<T>(path: string, method: string, body?: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      method,
      credentials: "same-origin",
      headers: { "x-ws-csrf": "1", ...(body !== undefined ? { "content-type": "application/json" } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const json = (await res.json().catch(() => null)) as { ok: boolean; data?: T; error?: Omit<ApiFailure, "status"> } | null;
    if (res.ok && json?.ok) return { ok: true, data: json.data as T };
    return { ok: false, error: { status: res.status, code: json?.error?.code ?? "internal_error", message: json?.error?.message ?? "Something went wrong. Please try again.", fields: json?.error?.fields, retryAfterSeconds: json?.error?.retryAfterSeconds } };
  } catch {
    return { ok: false, error: { status: 0, code: "network_error", message: "You appear to be offline. Check your connection and try again." } };
  }
}

const NO_RETRY = /^\/api\/auth\/(sign-in|register|refresh|forgot-password|reset-password|verify-email|resend-verification|sign-out)$/;

/** Calls the API; on an expired/invalid access token it refreshes once and retries transparently. */
export async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<ApiResult<T>> {
  const method = options.method ?? "GET";
  const first = await once<T>(path, method, options.body);
  if (first.ok || first.error.status !== 401 || NO_RETRY.test(path)) return first;
  if (!(await refreshSession())) return first;
  return once<T>(path, method, options.body);
}

/** Tells other tabs/hooks that per-user data changed so they refetch ("live" updates without Realtime). */
export function notifyUserStateChanged() {
  try { new BroadcastChannel("ws-user-state").postMessage("changed"); } catch { /* unsupported: other tabs refresh on focus */ }
  window.dispatchEvent(new Event("ws-user-state"));
}
