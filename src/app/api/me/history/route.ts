import { ok, protectedRoute } from "@/lib/auth/http";
import { db, dbOk } from "@/lib/auth/user-data";

export const GET = protectedRoute(async (_req, auth) => {
  const rows = dbOk(await db().from("viewing_history").select("tmdb_id, media_type, viewed_at").eq("user_id", auth.user.id).order("viewed_at", { ascending: false }).limit(100));
  return ok({ entries: rows.map((r) => ({ tmdbId: r.tmdb_id as number, mediaType: r.media_type as "movie" | "tv", viewedAt: r.viewed_at as string })) });
});
