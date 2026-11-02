import { withMetrics } from "@/lib/observability/with-metrics";
import { NextResponse } from "next/server";
import { getGenreMap } from "@/lib/tmdb/genres";

/** A client-safe id -> name genre lookup (the TMDB fetch itself must stay server-side). */
async function getHandler() {
  const map = await getGenreMap();
  return NextResponse.json(Object.fromEntries(map), { headers: { "Cache-Control": "public, max-age=86400" } });
}

export const GET = withMetrics("/api/genres", getHandler);
