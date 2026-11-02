import { NextResponse } from "next/server";
import { clearAuthCookies, ok, protectedRoute } from "@/lib/auth/http";
import { signOutAll } from "@/lib/auth/service";

export const POST = protectedRoute(async (_request, auth, ctx) => {
  const revoked = await signOutAll(auth, ctx);
  return clearAuthCookies(ok({ revoked }) as NextResponse);
});
