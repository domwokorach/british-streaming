export type AuthErrorCode =
  | "validation_failed" | "invalid_credentials" | "email_not_verified" | "unauthenticated" | "session_expired"
  | "forbidden" | "csrf_failed" | "rate_limited" | "invalid_token" | "refresh_conflict" | "bad_request" | "internal_error";

export class AuthError extends Error {
  constructor(
    readonly code: AuthErrorCode,
    readonly status: number,
    message: string,
    readonly extra: { fields?: Record<string, string>; retryAfterSeconds?: number } = {},
  ) {
    super(message);
  }
}
