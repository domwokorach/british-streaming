import { NextResponse } from "next/server";
import { toMediaItem } from "@/lib/tmdb";
import { getMovieDetails } from "@/lib/tmdb/movies";
import { getSeriesDetails } from "@/lib/tmdb/tv";

interface BatchItem { tmdbId: number; mediaType: "movie" | "tv"; }

/** Resolves a small set of {tmdbId, mediaType} references (e.g. from My List or Continue Watching) into real, normalized titles. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { items?: BatchItem[] } | null;
  const items = body?.items?.slice(0, 50) ?? [];
  const results = await Promise.allSettled(
    items.map(async (item) => {
      const media = item.mediaType === "tv" ? await getSeriesDetails(item.tmdbId) : await getMovieDetails(item.tmdbId);
      return toMediaItem(media, item.mediaType);
    }),
  );
  return NextResponse.json(results.filter((result) => result.status === "fulfilled").map((result) => result.value));
}
