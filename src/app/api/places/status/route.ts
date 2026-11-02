import { NextResponse } from "next/server";
import { placesApiKey } from "@/lib/places";

export function GET() {
  return NextResponse.json({ configured: Boolean(placesApiKey()) });
}
