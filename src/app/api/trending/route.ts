import { NextResponse } from "next/server";
import { toMediaItem } from "@/lib/tmdb";
import { getTrending } from "@/lib/tmdb/trending";

export async function GET() {
  try { return NextResponse.json((await getTrending()).results.map((item) => toMediaItem(item, item.title ? "movie" : "tv"))); } catch { return NextResponse.json({ error: "Trending titles are temporarily unavailable." }, { status: 503 }); }
}
