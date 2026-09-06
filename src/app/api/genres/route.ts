import { NextResponse } from "next/server";
import { getGenreMap } from "@/lib/tmdb/genres";

/** A client-safe id -> name genre lookup (the TMDB fetch itself must stay server-side). */
export async function GET() {
  const map = await getGenreMap();
  return NextResponse.json(Object.fromEntries(map), { headers: { "Cache-Control": "public, max-age=86400" } });
}
