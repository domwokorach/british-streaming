/**
 * Returns `next` only if it is a same-site relative path. Rejects absolute URLs, protocol-relative
 * (`//evil.com`), backslash tricks (`/\evil.com`), control characters and auth-loop targets.
 */
export function safeNext(next: string | null | undefined, fallback = "/"): string {
  if (!next || next.length > 512) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(next)) return fallback;
  let decoded = next;
  try { decoded = decodeURIComponent(next); } catch { return fallback; }
  if (decoded.startsWith("//") || decoded.includes("\\") || /^\/+[a-z][a-z0-9+.-]*:/i.test(decoded)) return fallback;
  if (/^\/(account\/(sign-in|register|forgot-password|reset-password|verify-email|session-refresh)|api\/)/.test(decoded)) return fallback;
  return next;
}
