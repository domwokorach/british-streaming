import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";
import { accessCookieName, jwtAudience, jwtIssuer, jwtSecretBytes, refreshCookieName } from "@/lib/auth/jwt-env";
import { safeNext } from "@/lib/auth/safe-redirect";

/**
 * Page-level route guard. This is a UX/perf layer only: it verifies the access JWT's signature, issuer,
 * audience and expiry, but cannot see revocation. Every API still re-validates the live session server-side.
 */
const PROTECTED = [/^\/browse\/?$/, /^\/account\/(profile|settings)\/?$/, /^\/account\/?$/, /^\/my-list(\/|$)/, /^\/watch-history(\/|$)/];
const GUEST_ONLY = /^\/account\/(sign-in|register|sign-up|forgot-password)\/?$/;

async function hasValidAccessToken(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(accessCookieName())?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, jwtSecretBytes(), { algorithms: ["HS256"], issuer: jwtIssuer(), audience: jwtAudience() });
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (PROTECTED.some((re) => re.test(pathname))) {
    if (await hasValidAccessToken(request)) return NextResponse.next();
    const target = new URL(request.cookies.get(refreshCookieName()) ? "/account/session-refresh" : "/account/sign-in", request.url);
    target.searchParams.set("next", safeNext(pathname + search));
    return NextResponse.redirect(target);
  }

  if (GUEST_ONLY.test(pathname) && (await hasValidAccessToken(request))) {
    return NextResponse.redirect(new URL(safeNext(request.nextUrl.searchParams.get("next")), request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/browse", "/account/:path*", "/my-list/:path*", "/watch-history/:path*"] };
