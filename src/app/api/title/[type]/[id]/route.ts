import { NextResponse } from "next/server";
import { toMediaDetails } from "@/lib/tmdb";
import { getMovieDetails } from "@/lib/tmdb/movies";
import { getSeriesDetails } from "@/lib/tmdb/tv";

/** Full, real title details (certification, runtime, cast, seasons, trailer, recommendations) for the More Info panel. */
export async function GET(_: Request, { params }: RouteContext<"/api/title/[type]/[id]">) {
  const { type, id } = await params;
  if ((type !== "movie" && type !== "tv") || !Number.isSafeInteger(Number(id))) return NextResponse.json({ error: "Invalid title." }, { status: 400 });
  try {
    const media = await (type === "tv" ? getSeriesDetails(Number(id)) : getMovieDetails(Number(id)));
    return NextResponse.json(toMediaDetails(media, type), { headers: { "Cache-Control": "public, max-age=1800" } });
  } catch {
    return NextResponse.json({ error: "Title details are temporarily unavailable." }, { status: 503 });
  }
}
