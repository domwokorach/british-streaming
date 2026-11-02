// Shared by the server config and the request proxy. No `server-only` marker so Proxy can import it;
// it still only ever runs on the server (the secret is not a NEXT_PUBLIC_ variable).
const DEV_SECRET = "dev-only-insecure-secret-change-me-0123456789abcdef";

export function jwtSecretBytes(): Uint8Array {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") throw new Error("AUTH_JWT_SECRET is required in production (>= 32 random bytes).");
    return new TextEncoder().encode(DEV_SECRET);
  }
  if (secret.length < 32) throw new Error("AUTH_JWT_SECRET must be at least 32 characters.");
  return new TextEncoder().encode(secret);
}
export const jwtIssuer = () => process.env.AUTH_JWT_ISSUER ?? "worldstreaming";
export const jwtAudience = () => process.env.AUTH_JWT_AUDIENCE ?? "worldstreaming-web";
// APP_URL is read at RUNTIME. NEXT_PUBLIC_* values are inlined at build time, which would pin one image to one
// environment and break "build once, promote dev -> staging -> prod". Keep this a plain server variable.
export const appUrl = () => (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
/**
 * Lets CI exercise the real production build against the in-memory store over plain http. It requires BOTH an
 * explicit flag and a loopback APP_URL, which no real deployment has, so it cannot be enabled by accident in prod.
 */
export const unsafeTestMode = () => {
  if (process.env.AUTH_UNSAFE_TEST_MODE !== "1") return false;
  try { return ["localhost", "127.0.0.1", "[::1]"].includes(new URL(appUrl()).hostname); } catch { return false; }
};
export const secureCookiesEnabled = () => (process.env.NODE_ENV === "production" && !unsafeTestMode()) || appUrl().startsWith("https://");
export const accessCookieName = () => (secureCookiesEnabled() ? "__Host-ws_at" : "ws_at");
export const refreshCookieName = () => (secureCookiesEnabled() ? "__Host-ws_rt" : "ws_rt");
