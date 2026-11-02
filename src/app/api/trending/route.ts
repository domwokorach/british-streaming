import { withMetrics } from "@/lib/observability/with-metrics";
import { NextResponse } from "next/server";
import { toMediaItem } from "@/lib/tmdb";
import { getTrending } from "@/lib/tmdb/trending";

async function getHandler() {
  try { return NextResponse.json((await getTrending()).results.map((item) => toMediaItem(item, item.title ? "movie" : "tv"))); } catch { return NextResponse.json({ error: "Trending titles are temporarily unavailable." }, { status: 503 }); }
}

export const GET = withMetrics("/api/trending", getHandler);
