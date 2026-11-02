import { z } from "zod";
import { ok, parseBody, protectedRoute } from "@/lib/auth/http";
import { db, dbOk, titleRef } from "@/lib/auth/user-data";

export const GET = protectedRoute(async (_req, auth) => {
  const rows = dbOk(await db().from("reactions").select("tmdb_id, media_type, reaction").eq("user_id", auth.user.id));
  return ok({ entries: rows.map((r) => ({ tmdbId: r.tmdb_id as number, mediaType: r.media_type as "movie" | "tv", reaction: r.reaction as "like" | "dislike" })) });
});

// PUT sets the reaction; `reaction: null` clears it.
export const PUT = protectedRoute(async (request, auth) => {
  const body = await parseBody(request, titleRef.extend({ reaction: z.enum(["like", "dislike"]).nullable() }));
  const q = db().from("reactions");
  if (body.reaction === null) dbOk(await q.delete().eq("user_id", auth.user.id).eq("tmdb_id", body.tmdbId).eq("media_type", body.mediaType));
  else dbOk(await q.upsert({ user_id: auth.user.id, tmdb_id: body.tmdbId, media_type: body.mediaType, reaction: body.reaction, updated_at: new Date().toISOString() }, { onConflict: "user_id,tmdb_id,media_type" }));
  return ok({ reaction: body.reaction });
});
