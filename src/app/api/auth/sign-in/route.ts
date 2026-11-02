import { NextResponse } from "next/server";
import { ok, parseBody, route, setAuthCookies } from "@/lib/auth/http";
import { signInSchema } from "@/lib/auth/schemas";
import { signIn } from "@/lib/auth/service";

export const POST = route(async (request, ctx) => {
  const { email, password, remember } = await parseBody(request, signInSchema);
  const { user, tokens } = await signIn({ email, password, remember }, ctx);
  return setAuthCookies(ok({ user }) as NextResponse, tokens); // tokens travel only in HttpOnly cookies, never in the body
});
