import { NextResponse } from "next/server";
import { clearAuthCookies, ok, readAccessCookie, readRefreshCookie, route } from "@/lib/auth/http";
import { signOut } from "@/lib/auth/service";

export const POST = route(async (request, ctx) => {
  await signOut({ refreshCookie: readRefreshCookie(request), accessToken: readAccessCookie(request) }, ctx);
  return clearAuthCookies(ok({ signedOut: true }) as NextResponse);
});
