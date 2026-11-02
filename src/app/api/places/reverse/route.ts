import { NextResponse, type NextRequest } from "next/server";
import { placesApiKey, reverseGeocode } from "@/lib/places";

export async function GET(request: NextRequest) {
  if (!placesApiKey()) return NextResponse.json({ configured: false }, { status: 501 });
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lon = Number(request.nextUrl.searchParams.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: "Invalid coordinates." }, { status: 400 });
  }
  try {
    const address = await reverseGeocode(lat, lon);
    return address ? NextResponse.json({ address }) : NextResponse.json({ error: "No address found." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Location service unavailable." }, { status: 502 });
  }
}
