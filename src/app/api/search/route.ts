import { NextResponse } from "next/server";
import { toMediaItem } from "@/lib/tmdb";
import { searchTitles } from "@/lib/tmdb/search";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query) return NextResponse.json([]);
  try { return NextResponse.json((await searchTitles(query)).results.filter((item) => item.title || item.name).map((item) => toMediaItem(item, item.title ? "movie" : "tv"))); } catch { return NextResponse.json({ error: "Search is temporarily unavailable." }, { status: 503 }); }
}
