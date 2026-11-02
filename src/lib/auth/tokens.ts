import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { errors, jwtVerify, SignJWT } from "jose";
import { authConfig } from "./config";

export type Role = "user" | "admin";
export interface AccessClaims { sub: string; sid: string; role: Role }

/** Short-lived, minimal claims. HS256 is pinned on both sign and verify (no `alg` negotiation). */
export async function signAccessToken(claims: AccessClaims, now = Date.now()): Promise<string> {
  const iat = Math.floor(now / 1000);
  return new SignJWT({ sid: claims.sid, role: claims.role })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(claims.sub)
    .setIssuer(authConfig.issuer)
    .setAudience(authConfig.audience)
    .setIssuedAt(iat)
    .setExpirationTime(iat + authConfig.accessTtlSeconds)
    .setJti(randomBytes(8).toString("hex"))
    .sign(authConfig.secret);
}

export type VerifyResult = { ok: true; claims: AccessClaims } | { ok: false; reason: "expired" | "invalid" };

export async function verifyAccessToken(token: string | undefined): Promise<VerifyResult> {
  if (!token) return { ok: false, reason: "invalid" };
  try {
    const { payload } = await jwtVerify(token, authConfig.secret, {
      algorithms: ["HS256"],
      issuer: authConfig.issuer,
      audience: authConfig.audience,
      requiredClaims: ["sub", "sid", "exp"],
    });
    if (typeof payload.sub !== "string" || typeof payload.sid !== "string") return { ok: false, reason: "invalid" };
    const role = payload.role === "admin" ? "admin" : "user";
    return { ok: true, claims: { sub: payload.sub, sid: payload.sid, role } };
  } catch (error) {
    return { ok: false, reason: error instanceof errors.JWTExpired ? "expired" : "invalid" };
  }
}

export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");

export function safeEqualHex(a: string | null | undefined, b: string): boolean {
  if (!a || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/** Refresh cookie format: `<sessionId>.<secret>`; only sha256(secret) is stored server-side. */
export function newRefreshToken(sessionId: string) {
  const secret = randomToken(32);
  return { token: `${sessionId}.${secret}`, hash: sha256(secret) };
}

export function parseRefreshToken(token: string | undefined): { sessionId: string; hash: string } | null {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot < 30 || dot > 40) return null;
  const sessionId = token.slice(0, dot);
  const secret = token.slice(dot + 1);
  if (!/^[0-9a-f-]{36}$/i.test(sessionId) || secret.length < 20 || secret.length > 100) return null;
  return { sessionId, hash: sha256(secret) };
}
