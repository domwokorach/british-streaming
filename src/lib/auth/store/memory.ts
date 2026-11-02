import "server-only";

import { randomUUID } from "node:crypto";
import type { AuditEvent, AuthStore, MemoryStoreExtras, OutboxMessage, SessionRecord, UserRecord } from "./types";

interface TokenRow { userId: string; hash: string; expiresAt: Date; usedAt: Date | null }

/** In-process store for local development and automated tests. Never selectable in production (see config). */
export class MemoryAuthStore implements AuthStore, MemoryStoreExtras {
  users = new Map<string, UserRecord>();
  sessions = new Map<string, SessionRecord>();
  resetTokens: TokenRow[] = [];
  verifyTokens: TokenRow[] = [];
  limits = new Map<string, { count: number; windowStart: number }>();
  outbox: OutboxMessage[] = [];
  auditLog: Array<AuditEvent & { at: Date }> = [];

  async findUserByEmail(email: string) { return [...this.users.values()].find((u) => u.email === email) ?? null; }
  async findUserById(id: string) { return this.users.get(id) ?? null; }
  async createUser(input: { fullName: string; email: string; passwordHash: string }) {
    if ([...this.users.values()].some((u) => u.email === input.email)) return null;
    const user: UserRecord = { id: randomUUID(), ...input, emailVerifiedAt: null, status: "active", role: "user", createdAt: new Date() };
    this.users.set(user.id, user);
    return user;
  }

  async createSession(input: Parameters<AuthStore["createSession"]>[0]) {
    const now = new Date();
    const session: SessionRecord = { ...input, previousTokenHash: null, rotatedAt: null, revokedAt: null, revokedReason: null, createdAt: now, lastUsedAt: now };
    this.sessions.set(session.id, session);
    return session;
  }
  async getSession(id: string) { return this.sessions.get(id) ?? null; }
  async rotateSession({ id, oldHash, newHash, expiresAt }: { id: string; oldHash: string; newHash: string; expiresAt: Date }) {
    const s = this.sessions.get(id);
    if (!s || s.revokedAt || s.refreshTokenHash !== oldHash || s.expiresAt <= new Date()) return false;
    // Single-threaded JS makes this block atomic, mirroring the SQL compare-and-swap.
    Object.assign(s, { previousTokenHash: oldHash, refreshTokenHash: newHash, rotatedAt: new Date(), lastUsedAt: new Date(), expiresAt });
    return true;
  }
  async revokeSession(id: string, reason: string) {
    const s = this.sessions.get(id);
    if (s && !s.revokedAt) Object.assign(s, { revokedAt: new Date(), revokedReason: reason });
  }
  async revokeAllSessions(userId: string, reason: string, exceptId?: string) {
    let n = 0;
    for (const s of this.sessions.values()) if (s.userId === userId && !s.revokedAt && s.id !== exceptId) { Object.assign(s, { revokedAt: new Date(), revokedReason: reason }); n++; }
    return n;
  }
  async listActiveSessions(userId: string) {
    const now = new Date();
    return [...this.sessions.values()].filter((s) => s.userId === userId && !s.revokedAt && s.expiresAt > now).sort((a, b) => b.lastUsedAt.getTime() - a.lastUsedAt.getTime());
  }

  async createResetToken(i: { userId: string; tokenHash: string; expiresAt: Date }) { this.resetTokens.push({ userId: i.userId, hash: i.tokenHash, expiresAt: i.expiresAt, usedAt: null }); }
  async createVerificationToken(i: { userId: string; tokenHash: string; expiresAt: Date }) { this.verifyTokens.push({ userId: i.userId, hash: i.tokenHash, expiresAt: i.expiresAt, usedAt: null }); }

  async resetPassword(tokenHash: string, passwordHash: string) {
    const row = this.resetTokens.find((t) => t.hash === tokenHash && !t.usedAt && t.expiresAt > new Date());
    if (!row) return null;
    const now = new Date();
    row.usedAt = now;
    for (const t of this.resetTokens) if (t.userId === row.userId && !t.usedAt) t.usedAt = now;
    const user = this.users.get(row.userId);
    if (user) user.passwordHash = passwordHash;
    await this.revokeAllSessions(row.userId, "password_reset");
    return row.userId;
  }
  async verifyEmail(tokenHash: string) {
    const row = this.verifyTokens.find((t) => t.hash === tokenHash && !t.usedAt && t.expiresAt > new Date());
    if (!row) return null;
    const now = new Date();
    for (const t of this.verifyTokens) if (t.userId === row.userId && !t.usedAt) t.usedAt = now;
    const user = this.users.get(row.userId);
    if (user && !user.emailVerifiedAt) user.emailVerifiedAt = now;
    return row.userId;
  }

  async rateLimitHit(key: string, windowSeconds: number, max: number) {
    const now = Date.now();
    const cur = this.limits.get(key);
    const entry = !cur || cur.windowStart < now - windowSeconds * 1000 ? { count: 1, windowStart: now } : { count: cur.count + 1, windowStart: cur.windowStart };
    this.limits.set(key, entry);
    const allowed = entry.count <= max;
    return { allowed, retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil((entry.windowStart + windowSeconds * 1000 - now) / 1000)) };
  }
  async rateLimitReset(key: string) { this.limits.delete(key); }

  async audit(event: AuditEvent) { this.auditLog.push({ ...event, at: new Date() }); }
}
