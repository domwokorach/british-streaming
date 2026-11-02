import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth/errors";
import { clearAuthCookies, failResponse, ok, readRefreshCookie, route, setAuthCookies } from "@/lib/auth/http";
import { refresh } from "@/lib/auth/service";

export const POST = route(async (request, ctx) => {
  try {
    const { user, tokens } = await refresh(readRefreshCookie(request), ctx);
    return setAuthCookies(ok({ user }) as NextResponse, tokens);
  } catch (error) {
    // A dead session must also drop its cookies; a benign multi-tab race (409) must not.
    if (error instanceof AuthError && (error.code === "unauthenticated" || error.code === "session_expired")) return clearAuthCookies(failResponse(error) as NextResponse);
    throw error;
  }
});
