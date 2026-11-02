import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { AuditEvent, AuthStore, SessionRecord, UserRecord } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any -- rows come from PostgREST untyped */
const d = (v: string | null) => (v ? new Date(v) : null);
const toUser = (r: any): UserRecord => ({ id: r.id, fullName: r.full_name, email: r.email, passwordHash: r.password_hash, emailVerifiedAt: d(r.email_verified_at), status: r.status, role: r.role, createdAt: new Date(r.created_at) });
const toSession = (r: any): SessionRecord => ({
  id: r.id, userId: r.user_id, refreshTokenHash: r.refresh_token_hash, previousTokenHash: r.previous_token_hash, rotatedAt: d(r.rotated_at),
  persistent: r.persistent, expiresAt: new Date(r.expires_at), absoluteExpiresAt: new Date(r.absolute_expires_at), revokedAt: d(r.revoked_at),
  revokedReason: r.revoked_reason, userAgent: r.user_agent, ip: r.ip, createdAt: new Date(r.created_at), lastUsedAt: new Date(r.last_used_at),
});

function must<T>(res: { data: T; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`auth store ${what} failed: ${res.error.message}`);
  return res.data;
}

export class SupabaseAuthStore implements AuthStore {
  private db: SupabaseClient;
  constructor(db: SupabaseClient = createSupabaseAdminClient()) { this.db = db; }

  async findUserByEmail(email: string) {
    const row = must(await this.db.from("users").select("*").eq("email", email).maybeSingle(), "findUserByEmail");
    return row ? toUser(row) : null;
  }
  async findUserById(id: string) {
    const row = must(await this.db.from("users").select("*").eq("id", id).maybeSingle(), "findUserById");
    return row ? toUser(row) : null;
  }
  async createUser(input: { fullName: string; email: string; passwordHash: string }) {
    const { data, error } = await this.db.from("users").insert({ full_name: input.fullName, email: input.email, password_hash: input.passwordHash }).select("*").single();
    if (error?.code === "23505") return null; // unique_violation: email already registered
    if (error) throw new Error(`auth store createUser failed: ${error.message}`);
    return toUser(data);
  }

  async createSession(i: Parameters<AuthStore["createSession"]>[0]) {
    const row = must(await this.db.from("auth_sessions").insert({
      id: i.id, user_id: i.userId, refresh_token_hash: i.refreshTokenHash, persistent: i.persistent,
      expires_at: i.expiresAt.toISOString(), absolute_expires_at: i.absoluteExpiresAt.toISOString(), user_agent: i.userAgent, ip: i.ip,
    }).select("*").single(), "createSession");
    return toSession(row);
  }
  async getSession(id: string) {
    const row = must(await this.db.from("auth_sessions").select("*").eq("id", id).maybeSingle(), "getSession");
    return row ? toSession(row) : null;
  }
  async rotateSession({ id, oldHash, newHash, expiresAt }: { id: string; oldHash: string; newHash: string; expiresAt: Date }) {
    // One UPDATE with the old hash in the WHERE clause is an atomic compare-and-swap in Postgres.
    const rows = must(await this.db.from("auth_sessions").update({
      previous_token_hash: oldHash, refresh_token_hash: newHash, rotated_at: new Date().toISOString(),
      last_used_at: new Date().toISOString(), expires_at: expiresAt.toISOString(),
    }).eq("id", id).eq("refresh_token_hash", oldHash).is("revoked_at", null).gt("expires_at", new Date().toISOString()).select("id"), "rotateSession");
    return (rows?.length ?? 0) === 1;
  }
  async revokeSession(id: string, reason: string) {
    must(await this.db.from("auth_sessions").update({ revoked_at: new Date().toISOString(), revoked_reason: reason }).eq("id", id).is("revoked_at", null), "revokeSession");
  }
  async revokeAllSessions(userId: string, reason: string, exceptId?: string) {
    let q = this.db.from("auth_sessions").update({ revoked_at: new Date().toISOString(), revoked_reason: reason }).eq("user_id", userId).is("revoked_at", null);
    if (exceptId) q = q.neq("id", exceptId);
    return must(await q.select("id"), "revokeAllSessions")?.length ?? 0;
  }
  async listActiveSessions(userId: string) {
    const rows = must(await this.db.from("auth_sessions").select("*").eq("user_id", userId).is("revoked_at", null).gt("expires_at", new Date().toISOString()).order("last_used_at", { ascending: false }), "listActiveSessions");
    return (rows ?? []).map(toSession);
  }

  async createResetToken(i: { userId: string; tokenHash: string; expiresAt: Date }) {
    must(await this.db.from("password_reset_tokens").insert({ user_id: i.userId, token_hash: i.tokenHash, expires_at: i.expiresAt.toISOString() }), "createResetToken");
  }
  async createVerificationToken(i: { userId: string; tokenHash: string; expiresAt: Date }) {
    must(await this.db.from("email_verification_tokens").insert({ user_id: i.userId, token_hash: i.tokenHash, expires_at: i.expiresAt.toISOString() }), "createVerificationToken");
  }
  async resetPassword(tokenHash: string, passwordHash: string) {
    return must(await this.db.rpc("auth_reset_password", { p_token_hash: tokenHash, p_password_hash: passwordHash }), "resetPassword") as string | null;
  }
  async verifyEmail(tokenHash: string) {
    return must(await this.db.rpc("auth_verify_email", { p_token_hash: tokenHash }), "verifyEmail") as string | null;
  }

  async rateLimitHit(key: string, windowSeconds: number, max: number) {
    const rows = must(await this.db.rpc("auth_rate_limit_hit", { p_key: key, p_window_seconds: windowSeconds, p_max: max }), "rateLimitHit") as Array<{ allowed: boolean; retry_after_seconds: number }>;
    const row = rows[0];
    return { allowed: row.allowed, retryAfterSeconds: row.retry_after_seconds };
  }
  async rateLimitReset(key: string) {
    must(await this.db.from("auth_rate_limits").delete().eq("key", key), "rateLimitReset");
  }

  async audit(e: AuditEvent) {
    // Audit failure must never break the request it describes, but it must not be silent either.
    const { error } = await this.db.from("auth_audit_log").insert({ event: e.event, user_id: e.userId ?? null, ip: e.ip ?? null, user_agent: e.userAgent ?? null, metadata: e.metadata ?? {} });
    if (error) console.error(JSON.stringify({ level: "error", message: "audit_write_failed", event: e.event, error: error.message }));
  }
}
