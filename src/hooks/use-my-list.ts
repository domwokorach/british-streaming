"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useUserStateRealtime } from "@/lib/supabase/realtime";
import { useAuth } from "@/providers/auth-provider";

interface MyListEntry { tmdbId: number; mediaType: "movie" | "tv"; }

/** Real, persisted "My List" backed by the `my_list` Supabase table — synced live across tabs via Realtime. */
export function useMyList() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<MyListEntry[]>([]);
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
      const { data } = await supabase.from("my_list").select("tmdb_id, media_type").eq("user_id", user.id);
      setEntries((data ?? []).map((row) => ({ tmdbId: row.tmdb_id as number, mediaType: row.media_type as "movie" | "tv" })));
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

  const isSaved = useCallback((tmdbId: number, mediaType: "movie" | "tv") => entries.some((entry) => entry.tmdbId === tmdbId && entry.mediaType === mediaType), [entries]);

  const toggle = useCallback(
    async (tmdbId: number, mediaType: "movie" | "tv") => {
      if (!user) {
        toast.error("Sign in required", { description: "Sign in to add titles to My List." });
        return;
      }
      const supabase = createSupabaseBrowserClient();
      if (isSaved(tmdbId, mediaType)) {
        await supabase.from("my_list").delete().eq("user_id", user.id).eq("tmdb_id", tmdbId).eq("media_type", mediaType);
      } else {
        await supabase.from("my_list").insert({ user_id: user.id, tmdb_id: tmdbId, media_type: mediaType });
      }
      refresh();
    },
    [user, isSaved, refresh],
  );

  return { entries, loading, isSaved, toggle };
}
