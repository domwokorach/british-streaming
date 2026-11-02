import { withMetrics } from "@/lib/observability/with-metrics";
import { NextResponse } from "next/server";
import { getNowPlayingMovies, getPopularMovies, getTopRatedMovies } from "@/lib/tmdb/movies";
import { toMediaItem } from "@/lib/tmdb";

async function getHandler(request: Request) {
  const collection = new URL(request.url).searchParams.get("collection") ?? "popular";
  const source = collection === "now-playing" ? getNowPlayingMovies : collection === "top-rated" ? getTopRatedMovies : getPopularMovies;
  try { return NextResponse.json((await source()).results.map((item) => toMediaItem(item, "movie"))); } catch { return NextResponse.json({ error: "Movies are temporarily unavailable." }, { status: 503 }); }
}

export const GET = withMetrics("/api/movies", getHandler);
