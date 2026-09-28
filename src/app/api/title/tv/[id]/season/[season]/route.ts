import { NextResponse } from "next/server";
import { getSeasonDetails } from "@/lib/tmdb/tv";

/** Real episode list (numbers, names, overviews, stills, runtimes, air dates) for one season of a series. */
export async function GET(_: Request, { params }: RouteContext<"/api/title/tv/[id]/season/[season]">) {
  const { id, season } = await params;
  const seriesId = Number(id);
  const seasonNumber = Number(season);
  if (!Number.isSafeInteger(seriesId) || !Number.isSafeInteger(seasonNumber)) return NextResponse.json({ error: "Invalid season." }, { status: 400 });
  try {
    const details = await getSeasonDetails(seriesId, seasonNumber);
    return NextResponse.json(details, { headers: { "Cache-Control": "public, max-age=1800" } });
  } catch {
    return NextResponse.json({ error: "Episode details are temporarily unavailable." }, { status: 503 });
  }
}
