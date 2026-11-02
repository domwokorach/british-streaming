import { ok, protectedRoute } from "@/lib/auth/http";
import { db, dbOk, parseTitleQuery } from "@/lib/auth/user-data";

export const GET = protectedRoute(async (_req, auth) => {
  const rows = dbOk(await db().from("watch_progress").select("tmdb_id, media_type, season_number, episode_number, progress_seconds, duration_seconds, completed")
    .eq("user_id", auth.user.id).eq("completed", false).order("updated_at", { ascending: false }));
  return ok({ entries: rows.map((r) => ({ tmdbId: r.tmdb_id, mediaType: r.media_type, seasonNumber: r.season_number, episodeNumber: r.episode_number, progressSeconds: r.progress_seconds, durationSeconds: r.duration_seconds })) });
});

export const DELETE = protectedRoute(async (request, auth) => {
  const t = parseTitleQuery(request);
  dbOk(await db().from("watch_progress").delete().eq("user_id", auth.user.id).eq("tmdb_id", t.tmdbId).eq("media_type", t.mediaType));
  return ok({ removed: true });
});
