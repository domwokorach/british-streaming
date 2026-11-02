"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api, notifyUserStateChanged } from "@/lib/auth/client";
import { useAuth } from "@/providers/auth-provider";
import { useUserStateSync } from "./use-user-state-sync";

interface ReactionEntry { tmdbId: number; mediaType: "movie" | "tv"; reaction: "like" | "dislike"; }

/** "Like" state via /api/me/reactions, synced across tabs. */
export function useReactions() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ReactionEntry[]>([]);

  const refresh = useCallback(async () => {
    if (!user) {
      setEntries([]);
      return;
    }
    const res = await api<{ entries: ReactionEntry[] }>("/api/me/reactions");
    setEntries(res.ok ? res.data.entries : []);
  }, [user]);

  useEffect(() => {
    queueMicrotask(refresh);
  }, [refresh]);
  useUserStateSync(Boolean(user), refresh);

  const isLiked = useCallback((tmdbId: number, mediaType: "movie" | "tv") => entries.some((entry) => entry.tmdbId === tmdbId && entry.mediaType === mediaType && entry.reaction === "like"), [entries]);

  const toggleLike = useCallback(
    async (tmdbId: number, mediaType: "movie" | "tv") => {
      if (!user) {
        toast.error("Sign in required", { description: "Sign in to like titles." });
        return;
      }
      const res = await api("/api/me/reactions", { method: "PUT", body: { tmdbId, mediaType, reaction: isLiked(tmdbId, mediaType) ? null : "like" } });
      if (!res.ok) toast.error("Couldn't save your reaction", { description: res.error.message });
      await refresh();
      notifyUserStateChanged();
    },
    [user, isLiked, refresh],
  );

  return { isLiked, toggleLike };
}
