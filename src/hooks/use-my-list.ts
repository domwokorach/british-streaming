"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api, notifyUserStateChanged } from "@/lib/auth/client";
import { useAuth } from "@/providers/auth-provider";
import { useUserStateSync } from "./use-user-state-sync";

interface MyListEntry { tmdbId: number; mediaType: "movie" | "tv"; }

/** Persisted "My List" via /api/me/list; other tabs update immediately and this tab on focus. */
export function useMyList() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<MyListEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }
    const res = await api<{ entries: MyListEntry[] }>("/api/me/list");
    setEntries(res.ok ? res.data.entries : []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    queueMicrotask(refresh);
  }, [refresh]);
  useUserStateSync(Boolean(user), refresh);

  const isSaved = useCallback((tmdbId: number, mediaType: "movie" | "tv") => entries.some((entry) => entry.tmdbId === tmdbId && entry.mediaType === mediaType), [entries]);

  const toggle = useCallback(
    async (tmdbId: number, mediaType: "movie" | "tv") => {
      if (!user) {
        toast.error("Sign in required", { description: "Sign in to add titles to My List." });
        return;
      }
      const saved = isSaved(tmdbId, mediaType);
      // Optimistic update, rolled back if the server refuses.
      setEntries((current) => (saved ? current.filter((e) => !(e.tmdbId === tmdbId && e.mediaType === mediaType)) : [...current, { tmdbId, mediaType }]));
      const res = saved
        ? await api(`/api/me/list?tmdbId=${tmdbId}&mediaType=${mediaType}`, { method: "DELETE" })
        : await api("/api/me/list", { method: "POST", body: { tmdbId, mediaType } });
      if (!res.ok) toast.error("Couldn't update My List", { description: res.error.message });
      await refresh();
      notifyUserStateChanged();
    },
    [user, isSaved, refresh],
  );

  return { entries, loading, isSaved, toggle };
}
