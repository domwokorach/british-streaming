import "server-only";

import { accessCookieName, appUrl, jwtAudience, jwtIssuer, jwtSecretBytes, refreshCookieName, secureCookiesEnabled, unsafeTestMode } from "./jwt-env";

const int = (name: string, fallback: number) => {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};
const bool = (name: string, fallback: boolean) => (process.env[name] === undefined ? fallback : process.env[name] === "true");

const isProd = process.env.NODE_ENV === "production";

/** Read lazily so tests and `next build` don't need every variable present. */
export const authConfig = {
  get secret() { return jwtSecretBytes(); },
  get issuer() { return jwtIssuer(); },
  get audience() { return jwtAudience(); },
  get accessTtlSeconds() { return int("AUTH_ACCESS_TTL_SECONDS", 15 * 60); },
  /** Idle lifetime of a refresh token; slides forward on every rotation up to the absolute cap. */
  get refreshTtlSeconds() { return int("AUTH_REFRESH_TTL_SECONDS", 24 * 60 * 60); },
  get rememberTtlSeconds() { return int("AUTH_REMEMBER_TTL_SECONDS", 30 * 24 * 60 * 60); },
  get absoluteTtlSeconds() { return int("AUTH_ABSOLUTE_TTL_SECONDS", 90 * 24 * 60 * 60); },
  /** Window in which a just-rotated token is treated as a benign multi-tab race instead of theft. */
  get refreshGraceSeconds() { return int("AUTH_REFRESH_GRACE_SECONDS", 10); },
  get resetTtlSeconds() { return int("AUTH_RESET_TTL_SECONDS", 30 * 60); },
  get verifyTtlHours() { return int("AUTH_VERIFY_TTL_HOURS", 24); },
  get requireVerifiedEmail() { return bool("AUTH_REQUIRE_VERIFIED_EMAIL", true); },
  get appUrl() { return appUrl(); },
  get secureCookies() { return secureCookiesEnabled(); },
  get trustProxy() { return bool("AUTH_TRUST_PROXY", isProd); },
  get storeKind(): "memory" | "supabase" {
    const kind = process.env.AUTH_STORE ?? "supabase";
    if (kind === "memory" && isProd && !unsafeTestMode()) throw new Error("AUTH_STORE=memory is not allowed in production.");
    return kind === "memory" ? "memory" : "supabase";
  },
  limits: {
    get signInPerIp() { return int("AUTH_LIMIT_SIGNIN_IP", 30); },
    get signInPerEmail() { return int("AUTH_LIMIT_SIGNIN_EMAIL", 8); },
    get registerPerIp() { return int("AUTH_LIMIT_REGISTER_IP", 10); },
    get forgotPerIp() { return int("AUTH_LIMIT_FORGOT_IP", 10); },
    get forgotPerEmail() { return int("AUTH_LIMIT_FORGOT_EMAIL", 3); },
    get resendPerEmail() { return int("AUTH_LIMIT_RESEND_EMAIL", 3); },
    get windowSeconds() { return int("AUTH_LIMIT_WINDOW_SECONDS", 15 * 60); },
  },
};

export const cookieNames = {
  // `__Host-` pins cookies to the exact origin, path=/ and Secure; only valid over HTTPS.
  get access() { return accessCookieName(); },
  get refresh() { return refreshCookieName(); },
};
