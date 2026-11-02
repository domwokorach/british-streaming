import { renderMetrics } from "@/lib/observability/metrics";

export const dynamic = "force-dynamic";

/** Prometheus scrape target. Protected by a bearer token when METRICS_TOKEN is set (always set it outside local dev). */
export function GET(request: Request) {
  const token = process.env.METRICS_TOKEN;
  if (token && request.headers.get("authorization") !== `Bearer ${token}`) return new Response("unauthorized", { status: 401 });
  return new Response(renderMetrics(), { headers: { "content-type": "text/plain; version=0.0.4; charset=utf-8", "cache-control": "no-store" } });
}
