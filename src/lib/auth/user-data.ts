import "server-only";

import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const titleRef = z.object({ tmdbId: z.number().int().positive().max(2_147_483_647), mediaType: z.enum(["movie", "tv"]) });

/**
 * Service-role client for per-user data. RLS is bypassed by design, so EVERY query below must be
 * scoped by the authenticated `userId` taken from the verified session — never from request input.
 */
export const db = () => createSupabaseAdminClient();

/** Unwraps a PostgREST response; list queries return `[]` instead of null. */
export function dbOk<T>(res: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (res.error) throw new Error(`user data query failed: ${res.error.message}`);
  return (res.data ?? []) as NonNullable<T>;
}

export function parseTitleQuery(request: Request) {
  const p = new URL(request.url).searchParams;
  return titleRef.parse({ tmdbId: Number(p.get("tmdbId")), mediaType: p.get("mediaType") });
}
