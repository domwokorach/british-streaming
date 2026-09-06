import { NextResponse } from "next/server";
import { getPopularSeries, getTopRatedSeries } from "@/lib/tmdb/tv";
import { toMediaItem } from "@/lib/tmdb";

export async function GET(request: Request) {
  const source = new URL(request.url).searchParams.get("collection") === "top-rated" ? getTopRatedSeries : getPopularSeries;
  try { return NextResponse.json((await source()).results.map((item) => toMediaItem(item, "tv"))); } catch { return NextResponse.json({ error: "Series are temporarily unavailable." }, { status: 503 }); }
}
