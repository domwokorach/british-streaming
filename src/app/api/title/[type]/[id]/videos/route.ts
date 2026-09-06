import { NextResponse } from "next/server";
import { getVideos, selectTrailer } from "@/lib/tmdb/videos";

export async function GET(_: Request, { params }: RouteContext<"/api/title/[type]/[id]/videos">) {
  const { type, id } = await params;
  if ((type !== "movie" && type !== "tv") || !Number.isSafeInteger(Number(id))) return NextResponse.json({ error: "Invalid title." }, { status: 400 });
  try {
    const trailerKey = selectTrailer((await getVideos(type, Number(id))).results);
    return NextResponse.json({ trailerKey });
  } catch {
    return NextResponse.json({ error: "Video metadata is temporarily unavailable." }, { status: 503 });
  }
}
