import type { Role } from "../tokens";

export interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  emailVerifiedAt: Date | null;
  status: "active" | "suspended" | "deleted";
  role: Role;
  createdAt: Date;
}

export interface SessionRecord {
  id: string;
  userId: string;
  refreshTokenHash: string;
  previousTokenHash: string | null;
  rotatedAt: Date | null;
  persistent: boolean;
  expiresAt: Date;
  absoluteExpiresAt: Date;
  revokedAt: Date | null;
  revokedReason: string | null;
  userAgent: string | null;
  ip: string | null;
  createdAt: Date;
  lastUsedAt: Date;
}

export interface AuditEvent {
  event: string;
  userId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

export interface RateLimitResult { allowed: boolean; retryAfterSeconds: number }

export interface OutboxMessage { to: string; subject: string; text: string; link?: string; kind: string; at: Date }

/**
 * Persistence boundary for authentication. Operations that must be atomic (token consumption,
 * refresh rotation, rate-limit counting) are single methods so each implementation can make them
 * transactional (Postgres functions / compare-and-swap) rather than racing read-then-write.
 */
export interface AuthStore {
  findUserByEmail(email: string): Promise<UserRecord | null>;
  findUserById(id: string): Promise<UserRecord | null>;
  /** Returns null when the email is already registered (unique constraint). */
  createUser(input: { fullName: string; email: string; passwordHash: string }): Promise<UserRecord | null>;

  createSession(input: Omit<SessionRecord, "id" | "previousTokenHash" | "rotatedAt" | "revokedAt" | "revokedReason" | "createdAt" | "lastUsedAt"> & { id: string }): Promise<SessionRecord>;
  getSession(id: string): Promise<SessionRecord | null>;
  /** Atomic compare-and-swap: succeeds only if the stored hash still equals `oldHash` and the session is live. */
  rotateSession(input: { id: string; oldHash: string; newHash: string; expiresAt: Date }): Promise<boolean>;
  revokeSession(id: string, reason: string): Promise<void>;
  revokeAllSessions(userId: string, reason: string, exceptId?: string): Promise<number>;
  listActiveSessions(userId: string): Promise<SessionRecord[]>;

  createResetToken(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void>;
  createVerificationToken(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void>;
  /** Consume token, set password, void other tokens and revoke all sessions in one transaction. Returns user id or null. */
  resetPassword(tokenHash: string, passwordHash: string): Promise<string | null>;
  /** Consume token and mark the email verified in one transaction. Returns user id or null. */
  verifyEmail(tokenHash: string): Promise<string | null>;

  rateLimitHit(key: string, windowSeconds: number, max: number): Promise<RateLimitResult>;
  rateLimitReset(key: string): Promise<void>;

  audit(event: AuditEvent): Promise<void>;
}

/** Test/dev-only helpers exposed by the in-memory store. */
export interface MemoryStoreExtras {
  outbox: OutboxMessage[];
  auditLog: Array<AuditEvent & { at: Date }>;
}
