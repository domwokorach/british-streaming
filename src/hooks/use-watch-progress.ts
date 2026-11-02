"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/auth/client";
import { useUserStateSync } from "./use-user-state-sync";
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
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }
    const res = await api<{ entries: Array<{ tmdbId: number; mediaType: "movie" | "tv"; seasonNumber: number | null; episodeNumber: number | null; progressSeconds: number; durationSeconds: number }> }>("/api/me/progress");
    setEntries(
      res.ok
        ? res.data.entries
            .filter((row) => row.progressSeconds > 0 && row.durationSeconds > 0)
            .map((row) => ({ tmdbId: row.tmdbId, mediaType: row.mediaType, seasonNumber: row.seasonNumber, episodeNumber: row.episodeNumber, percent: Math.min(100, Math.round((row.progressSeconds / row.durationSeconds) * 100)) }))
        : [],
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    queueMicrotask(refresh);
  }, [refresh]);
  useUserStateSync(Boolean(user), refresh);

  const removeEntry = useCallback(
    async (tmdbId: number, mediaType: "movie" | "tv") => {
      if (!user) return;
      await api(`/api/me/progress?tmdbId=${tmdbId}&mediaType=${mediaType}`, { method: "DELETE" });
      setEntries((current) => current.filter((entry) => !(entry.tmdbId === tmdbId && entry.mediaType === mediaType)));
    },
    [user],
  );

  return { entries, loading, removeEntry };
}
