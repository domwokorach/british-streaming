type Level = "debug" | "info" | "warn" | "error";

/** One JSON object per line on stdout so Loki/CloudWatch can parse fields without regexes. */
export function log(level: Level, message: string, fields: Record<string, unknown> = {}) {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, service: process.env.SERVICE_NAME ?? "worldstreaming-web", env: process.env.APP_ENV ?? "local", version: process.env.APP_VERSION ?? "dev", message, ...fields });
  (level === "error" ? console.error : console.log)(line);
}
