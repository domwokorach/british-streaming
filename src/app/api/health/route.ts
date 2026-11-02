// Liveness: the process is up and able to answer. Must not touch dependencies,
// otherwise a TMDB/Supabase blip would make the orchestrator restart healthy containers.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok", version: process.env.APP_VERSION ?? "dev", uptimeSeconds: Math.round(process.uptime()) }, { headers: { "cache-control": "no-store" } });
}
