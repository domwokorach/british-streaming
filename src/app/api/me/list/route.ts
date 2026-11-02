import { ok, parseBody, protectedRoute } from "@/lib/auth/http";
import { db, dbOk, parseTitleQuery, titleRef } from "@/lib/auth/user-data";

export const GET = protectedRoute(async (_req, auth) => {
  const rows = dbOk(await db().from("my_list").select("tmdb_id, media_type").eq("user_id", auth.user.id).order("created_at", { ascending: false }));
  return ok({ entries: rows.map((r) => ({ tmdbId: r.tmdb_id as number, mediaType: r.media_type as "movie" | "tv" })) });
});

export const POST = protectedRoute(async (request, auth) => {
  const t = await parseBody(request, titleRef);
  dbOk(await db().from("my_list").upsert({ user_id: auth.user.id, tmdb_id: t.tmdbId, media_type: t.mediaType }, { onConflict: "user_id,tmdb_id,media_type", ignoreDuplicates: true }));
  return ok({ saved: true }, { status: 201 });
});

export const DELETE = protectedRoute(async (request, auth) => {
  const t = parseTitleQuery(request);
  dbOk(await db().from("my_list").delete().eq("user_id", auth.user.id).eq("tmdb_id", t.tmdbId).eq("media_type", t.mediaType));
  return ok({ saved: false });
});
