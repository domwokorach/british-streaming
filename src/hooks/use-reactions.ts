"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useUserStateRealtime } from "@/lib/supabase/realtime";
import { useAuth } from "@/providers/auth-provider";

interface ReactionEntry { tmdbId: number; mediaType: "movie" | "tv"; reaction: "like" | "dislike"; }

/** Real "Like" state backed by the `reactions` Supabase table — synced live across tabs via Realtime. */
export function useReactions() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ReactionEntry[]>([]);

  const refresh = useCallback(async () => {
    await Promise.resolve();
    if (!user) {
      setEntries([]);
      return;
    }
    try {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.from("reactions").select("tmdb_id, media_type, reaction").eq("user_id", user.id);
      setEntries((data ?? []).map((row) => ({ tmdbId: row.tmdb_id as number, mediaType: row.media_type as "movie" | "tv", reaction: row.reaction as "like" | "dislike" })));
    } catch {
      setEntries([]);
    }
  }, [user]);

  useEffect(() => {
    queueMicrotask(refresh);
  }, [refresh]);
  useUserStateRealtime(user?.id ?? null, refresh);

  const isLiked = useCallback((tmdbId: number, mediaType: "movie" | "tv") => entries.some((entry) => entry.tmdbId === tmdbId && entry.mediaType === mediaType && entry.reaction === "like"), [entries]);

  const toggleLike = useCallback(
    async (tmdbId: number, mediaType: "movie" | "tv") => {
      if (!user) {
        toast.error("Sign in required", { description: "Sign in to like titles." });
        return;
      }
      const supabase = createSupabaseBrowserClient();
      if (isLiked(tmdbId, mediaType)) {
        await supabase.from("reactions").delete().eq("user_id", user.id).eq("tmdb_id", tmdbId).eq("media_type", mediaType);
      } else {
        await supabase.from("reactions").upsert({ user_id: user.id, tmdb_id: tmdbId, media_type: mediaType, reaction: "like", updated_at: new Date().toISOString() });
      }
      refresh();
    },
    [user, isLiked, refresh],
  );

  return { isLiked, toggleLike };
}
