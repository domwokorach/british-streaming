"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useUserStateRealtime } from "@/lib/supabase/realtime";
import { useAuth } from "@/providers/auth-provider";

export interface WatchProgressEntry {
  tmdbId: number;
  mediaType: "movie" | "tv";
  seasonNumber: number | null;
  episodeNumber: number | null;
  percent: number;
}

/**
 * Real "Continue Watching" state from the `watch_progress` table — never a fabricated percentage.
 * Rows with no real playback recorded (zero progress, or a zero/undefined duration) are dropped.
 */
export function useWatchProgress() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<WatchProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    await Promise.resolve();
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }
    try {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase
        .from("watch_progress")
        .select("tmdb_id, media_type, season_number, episode_number, progress_seconds, duration_seconds, completed")
        .eq("user_id", user.id)
        .eq("completed", false)
        .order("updated_at", { ascending: false });
      setEntries(
        (data ?? [])
          .filter((row) => row.progress_seconds > 0 && row.duration_seconds > 0)
          .map((row) => ({
            tmdbId: row.tmdb_id as number,
            mediaType: row.media_type as "movie" | "tv",
            seasonNumber: row.season_number as number | null,
            episodeNumber: row.episode_number as number | null,
            percent: Math.min(100, Math.round((row.progress_seconds / row.duration_seconds) * 100)),
          })),
      );
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    queueMicrotask(refresh);
  }, [refresh]);
  useUserStateRealtime(user?.id ?? null, refresh);

  const removeEntry = useCallback(
    async (tmdbId: number, mediaType: "movie" | "tv") => {
      if (!user) return;
      const supabase = createSupabaseBrowserClient();
      await supabase.from("watch_progress").delete().eq("user_id", user.id).eq("tmdb_id", tmdbId).eq("media_type", mediaType);
      setEntries((current) => current.filter((entry) => !(entry.tmdbId === tmdbId && entry.mediaType === mediaType)));
    },
    [user],
  );

  return { entries, loading, removeEntry };
}
