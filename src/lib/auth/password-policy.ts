// Pure and dependency-free: shared by the server (enforcement) and the browser (strength meter).
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128; // bounds Argon2 work an attacker can force

const COMMON = new Set([
  "password", "password1", "password123", "passw0rd123", "1234567890", "12345678910", "qwertyuiop", "qwerty12345",
  "letmein1234", "iloveyou123", "welcome1234", "admin12345", "abc1234567", "1q2w3e4r5t", "worldstreaming",
]);

export interface PasswordCheck {
  ok: boolean;
  /** 0 (unacceptable) – 4 (strong), for the UI meter. */
  score: 0 | 1 | 2 | 3 | 4;
  label: "Too weak" | "Weak" | "Fair" | "Good" | "Strong";
  problems: string[];
}

export function checkPassword(password: string, context: { email?: string; name?: string } = {}): PasswordCheck {
  const problems: string[] = [];
  if (password.length < PASSWORD_MIN_LENGTH) problems.push(`Use at least ${PASSWORD_MIN_LENGTH} characters.`);
  if (password.length > PASSWORD_MAX_LENGTH) problems.push(`Use at most ${PASSWORD_MAX_LENGTH} characters.`);
  const lower = password.toLowerCase();
  if (COMMON.has(lower)) problems.push("That password is too common.");
  const local = context.email?.split("@")[0]?.toLowerCase();
  if (local && local.length >= 4 && lower.includes(local)) problems.push("Don't include your email name.");
  if (/^(.)\1+$/.test(password)) problems.push("Don't repeat a single character.");

  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  let score = 0;
  if (password.length >= PASSWORD_MIN_LENGTH) score = 1;
  if (score && classes >= 2) score = 2;
  if (score >= 2 && (password.length >= 14 || classes >= 3)) score = 3;
  if (score >= 3 && password.length >= 16 && classes >= 3) score = 4;
  if (problems.length) score = Math.min(score, 1) as 0 | 1;
  if (problems.length && password.length < PASSWORD_MIN_LENGTH) score = 0;
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"] as const;
  return { ok: problems.length === 0, score: score as PasswordCheck["score"], label: labels[score], problems };
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const normalizeEmail = (email: string) => email.trim().toLowerCase();
