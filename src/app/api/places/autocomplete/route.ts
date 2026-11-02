import { NextResponse, type NextRequest } from "next/server";
import { autocompleteAddress, placesApiKey } from "@/lib/places";

export async function GET(request: NextRequest) {
  if (!placesApiKey()) return NextResponse.json({ configured: false }, { status: 501 });
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 3 || q.length > 120) return NextResponse.json({ suggestions: [] });
  try {
    return NextResponse.json({ suggestions: await autocompleteAddress(q) });
  } catch {
    return NextResponse.json({ error: "Location service unavailable." }, { status: 502 });
  }
}
