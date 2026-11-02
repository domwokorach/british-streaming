import "server-only";

import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { authConfig } from "./config";
import { AuthError } from "./errors";
import { mails, sendMail } from "./mailer";
import { burnPasswordCheck, hashPassword, verifyPassword } from "./passwords";
import { checkPassword } from "./password-policy";
import { getStore } from "./store";
import type { SessionRecord, UserRecord } from "./store/types";
import { newRefreshToken, parseRefreshToken, randomToken, safeEqualHex, sha256, signAccessToken, verifyAccessToken, type Role } from "./tokens";

export interface ClientContext { ip: string; userAgent: string | null }
export interface PublicUser { id: string; fullName: string; email: string; emailVerified: boolean; role: Role }
export interface IssuedTokens { access: string; refresh: string; persistent: boolean; sessionId: string }

export const toPublicUser = (u: UserRecord): PublicUser => ({ id: u.id, fullName: u.fullName, email: u.email, emailVerified: Boolean(u.emailVerifiedAt), role: u.role });

const audit = (event: string, ctx: ClientContext, userId?: string | null, metadata?: Record<string, unknown>) =>
  getStore().audit({ event, userId, ip: ctx.ip, userAgent: ctx.userAgent, metadata });

async function limit(key: string, max: number, ctx: ClientContext, event: string) {
  const res = await getStore().rateLimitHit(key, authConfig.limits.windowSeconds, max);
  if (!res.allowed) {
    await audit("rate_limited", ctx, null, { bucket: event });
    throw new AuthError("rate_limited", 429, "Too many attempts. Please wait and try again.", { retryAfterSeconds: res.retryAfterSeconds });
  }
}

const addSeconds = (s: number, from = Date.now()) => new Date(from + s * 1000);

async function startSession(user: UserRecord, persistent: boolean, ctx: ClientContext): Promise<IssuedTokens> {
  const id = randomUUID();
  const refresh = newRefreshToken(id);
  const now = Date.now();
  await getStore().createSession({
    id, userId: user.id, refreshTokenHash: refresh.hash, persistent,
    expiresAt: addSeconds(persistent ? authConfig.rememberTtlSeconds : authConfig.refreshTtlSeconds, now),
    absoluteExpiresAt: addSeconds(authConfig.absoluteTtlSeconds, now), userAgent: ctx.userAgent?.slice(0, 300) ?? null, ip: ctx.ip,
  });
  return { access: await signAccessToken({ sub: user.id, sid: id, role: user.role }), refresh: refresh.token, persistent, sessionId: id };
}

async function issueVerification(user: UserRecord) {
  const token = randomToken(32);
  await getStore().createVerificationToken({ userId: user.id, tokenHash: sha256(token), expiresAt: addSeconds(authConfig.verifyTtlHours * 3600) });
  await sendMail(mails.verify(user.email, user.fullName, token));
}

export async function register(input: { fullName: string; email: string; password: string }, ctx: ClientContext) {
  await limit(`register:ip:${ctx.ip}`, authConfig.limits.registerPerIp, ctx, "register");
  const policy = checkPassword(input.password, { email: input.email, name: input.fullName });
  if (!policy.ok) throw new AuthError("validation_failed", 422, "Choose a stronger password.", { fields: { password: policy.problems[0] } });

  const passwordHash = await hashPassword(input.password);
  const user = await getStore().createUser({ fullName: input.fullName.trim(), email: input.email, passwordHash });
  // Identical response either way, so the endpoint can't be used to discover who has an account.
  after(async () => {
    if (user) { await audit("register", ctx, user.id); await issueVerification(user); }
    else { await audit("register_duplicate", ctx, null, { emailHash: sha256(input.email).slice(0, 12) }); await sendMail(mails.alreadyRegistered(input.email)); }
  });
}

export async function signIn(input: { email: string; password: string; remember: boolean }, ctx: ClientContext) {
  const emailKey = `signin:email:${sha256(input.email)}`;
  await limit(`signin:ip:${ctx.ip}`, authConfig.limits.signInPerIp, ctx, "signin_ip");
  await limit(emailKey, authConfig.limits.signInPerEmail, ctx, "signin_email");

  const user = await getStore().findUserByEmail(input.email);
  const valid = user && user.status === "active" ? await verifyPassword(user.passwordHash, input.password) : (await burnPasswordCheck(input.password), false);
  if (!user || !valid) {
    await audit("sign_in_failed", ctx, user?.id ?? null);
    throw new AuthError("invalid_credentials", 401, "Incorrect email or password.");
  }
  if (authConfig.requireVerifiedEmail && !user.emailVerifiedAt) {
    await audit("sign_in_blocked_unverified", ctx, user.id);
    throw new AuthError("email_not_verified", 403, "Please verify your email address before signing in.");
  }
  await getStore().rateLimitReset(emailKey);
  const tokens = await startSession(user, input.remember, ctx);
  await audit("sign_in", ctx, user.id, { sessionId: tokens.sessionId, remember: input.remember });
  return { user: toPublicUser(user), tokens };
}

export async function refresh(refreshCookie: string | undefined, ctx: ClientContext) {
  const parsed = parseRefreshToken(refreshCookie);
  if (!parsed) throw new AuthError("unauthenticated", 401, "Session not found.");
  const store = getStore();
  const session = await store.getSession(parsed.sessionId);
  if (!session || session.revokedAt) throw new AuthError("unauthenticated", 401, "Session not found.");
  const now = new Date();

  if (safeEqualHex(session.refreshTokenHash, parsed.hash)) {
    if (session.expiresAt <= now || session.absoluteExpiresAt <= now) {
      await store.revokeSession(session.id, "expired");
      throw new AuthError("session_expired", 401, "Your session has expired. Please sign in again.");
    }
    const user = await store.findUserById(session.userId);
    if (!user || user.status !== "active") {
      await store.revokeSession(session.id, "user_inactive");
      throw new AuthError("unauthenticated", 401, "Session not found.");
    }
    const next = newRefreshToken(session.id);
    const idleExpiry = addSeconds(session.persistent ? authConfig.rememberTtlSeconds : authConfig.refreshTtlSeconds);
    const expiresAt = idleExpiry < session.absoluteExpiresAt ? idleExpiry : session.absoluteExpiresAt;
    // Compare-and-swap: if a concurrent request rotated first, this one loses cleanly.
    if (!(await store.rotateSession({ id: session.id, oldHash: parsed.hash, newHash: next.hash, expiresAt }))) {
      throw new AuthError("refresh_conflict", 409, "Session was refreshed elsewhere.");
    }
    await audit("token_refreshed", ctx, user.id, { sessionId: session.id });
    return { user: toPublicUser(user), tokens: { access: await signAccessToken({ sub: user.id, sid: session.id, role: user.role }), refresh: next.token, persistent: session.persistent, sessionId: session.id } satisfies IssuedTokens };
  }

  if (safeEqualHex(session.previousTokenHash, parsed.hash)) {
    // Someone presented an already-rotated token. Within the grace window it's two tabs racing;
    // after it, the token was copied and replayed, so the whole session is burned.
    if (session.rotatedAt && now.getTime() - session.rotatedAt.getTime() <= authConfig.refreshGraceSeconds * 1000) {
      throw new AuthError("refresh_conflict", 409, "Session was refreshed elsewhere.");
    }
    await store.revokeSession(session.id, "refresh_reuse_detected");
    await audit("refresh_reuse_detected", ctx, session.userId, { sessionId: session.id });
    throw new AuthError("unauthenticated", 401, "Session not found.");
  }
  throw new AuthError("unauthenticated", 401, "Session not found.");
}

export interface Authenticated { user: UserRecord; session: SessionRecord; role: Role }

/** Full server-side check used by every protected endpoint: signature, claims, expiry AND live session state. */
export async function authenticate(accessToken: string | undefined): Promise<Authenticated> {
  const result = await verifyAccessToken(accessToken);
  if (!result.ok) throw new AuthError(result.reason === "expired" ? "session_expired" : "unauthenticated", 401, result.reason === "expired" ? "Access token expired." : "Authentication required.");
  const store = getStore();
  const session = await store.getSession(result.claims.sid);
  const now = new Date();
  if (!session || session.revokedAt || session.userId !== result.claims.sub || session.absoluteExpiresAt <= now) throw new AuthError("unauthenticated", 401, "Authentication required.");
  const user = await store.findUserById(session.userId);
  if (!user || user.status !== "active") throw new AuthError("unauthenticated", 401, "Authentication required.");
  return { user, session, role: user.role }; // role comes from the DB, not the (possibly stale) token
}

export async function signOut(input: { refreshCookie?: string; accessToken?: string }, ctx: ClientContext) {
  const store = getStore();
  let sessionId: string | null = null;
  const parsed = parseRefreshToken(input.refreshCookie);
  if (parsed) {
    const s = await store.getSession(parsed.sessionId);
    if (s && (safeEqualHex(s.refreshTokenHash, parsed.hash) || safeEqualHex(s.previousTokenHash, parsed.hash))) sessionId = s.id;
  }
  if (!sessionId) {
    const v = await verifyAccessToken(input.accessToken);
    if (v.ok) sessionId = v.claims.sid;
  }
  if (sessionId) {
    const s = await store.getSession(sessionId);
    await store.revokeSession(sessionId, "sign_out");
    await audit("sign_out", ctx, s?.userId ?? null, { sessionId });
  }
}

export async function signOutAll(auth: Authenticated, ctx: ClientContext) {
  const count = await getStore().revokeAllSessions(auth.user.id, "sign_out_all");
  await audit("sign_out_all", ctx, auth.user.id, { revoked: count });
  return count;
}

export async function revokeOtherSession(auth: Authenticated, sessionId: string, ctx: ClientContext) {
  const target = await getStore().getSession(sessionId);
  if (!target || target.userId !== auth.user.id) throw new AuthError("forbidden", 404, "Session not found."); // never confirm another user's session ids
  await getStore().revokeSession(sessionId, "revoked_by_user");
  await audit("session_revoked", ctx, auth.user.id, { sessionId });
}

export async function forgotPassword(email: string, ctx: ClientContext) {
  await limit(`forgot:ip:${ctx.ip}`, authConfig.limits.forgotPerIp, ctx, "forgot_ip");
  await limit(`forgot:email:${sha256(email)}`, authConfig.limits.forgotPerEmail, ctx, "forgot_email");
  after(async () => {
    const user = await getStore().findUserByEmail(email);
    await audit("password_reset_requested", ctx, user?.id ?? null, { known: Boolean(user) });
    if (!user || user.status !== "active") return;
    const token = randomToken(32); // 256 bits; only the hash is persisted
    await getStore().createResetToken({ userId: user.id, tokenHash: sha256(token), expiresAt: addSeconds(authConfig.resetTtlSeconds) });
    await sendMail(mails.reset(user.email, user.fullName, token));
  });
}

export async function resetPassword(input: { token: string; password: string }, ctx: ClientContext) {
  await limit(`reset:ip:${ctx.ip}`, authConfig.limits.signInPerIp, ctx, "reset_ip");
  const policy = checkPassword(input.password);
  if (!policy.ok) throw new AuthError("validation_failed", 422, "Choose a stronger password.", { fields: { password: policy.problems[0] } });
  const userId = await getStore().resetPassword(sha256(input.token), await hashPassword(input.password));
  if (!userId) {
    await audit("password_reset_failed", ctx);
    throw new AuthError("invalid_token", 400, "This reset link is invalid or has expired.");
  }
  await audit("password_reset", ctx, userId);
  after(async () => {
    const user = await getStore().findUserById(userId);
    if (user) await sendMail(mails.passwordChanged(user.email, user.fullName));
  });
}

export async function verifyEmail(token: string, ctx: ClientContext) {
  await limit(`verify:ip:${ctx.ip}`, authConfig.limits.signInPerIp, ctx, "verify_ip");
  const userId = await getStore().verifyEmail(sha256(token));
  if (!userId) throw new AuthError("invalid_token", 400, "This verification link is invalid or has expired.");
  await audit("email_verified", ctx, userId);
}

export async function resendVerification(email: string, ctx: ClientContext) {
  await limit(`resend:ip:${ctx.ip}`, authConfig.limits.forgotPerIp, ctx, "resend_ip");
  await limit(`resend:email:${sha256(email)}`, authConfig.limits.resendPerEmail, ctx, "resend_email");
  after(async () => {
    const user = await getStore().findUserByEmail(email);
    if (user && user.status === "active" && !user.emailVerifiedAt) { await audit("verification_resent", ctx, user.id); await issueVerification(user); }
  });
}
