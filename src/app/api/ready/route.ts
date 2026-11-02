// Readiness: the instance has the configuration it needs to serve traffic.
// Failing this takes the task out of the load balancer without restarting it.
export const dynamic = "force-dynamic";

const REQUIRED = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SECRET_KEY", "TMDB_API_READ_TOKEN", "AUTH_JWT_SECRET"] as const;

export function GET() {
  const missing = REQUIRED.filter((name) => !process.env[name] || process.env[name]?.includes("YOUR_"));
  const ready = missing.length === 0;
  return Response.json({ status: ready ? "ready" : "not_ready", missing }, { status: ready ? 200 : 503, headers: { "cache-control": "no-store" } });
}
