"use client";

import { useEffect, useState } from "react";
import { toPresentationTitleClient } from "@/lib/catalogue-client";
import type { MediaItem } from "@/lib/tmdb/types";
import type { MediaTitle } from "@/lib/types";

let genreMapPromise: Promise<Record<number, string>> | null = null;
function getGenreMapOnce() {
  if (!genreMapPromise) genreMapPromise = fetch("/api/genres").then((response) => response.json());
  return genreMapPromise;
}

interface TitleRef { tmdbId: number; mediaType: "movie" | "tv"; percent?: number; }

/** Resolves {tmdbId, mediaType} references (My List, Continue Watching entries, ...) into real, displayable MediaTitle cards. */
export function useResolvedTitles(refs: TitleRef[]) {
  const [titles, setTitles] = useState<MediaTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const key = refs.map((ref) => `${ref.mediaType}-${ref.tmdbId}:${ref.percent ?? ""}`).join(",");

  useEffect(() => {
    let cancelled = false;
    if (refs.length === 0) {
      queueMicrotask(() => {
        if (cancelled) return;
        setTitles([]);
        setLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }
    queueMicrotask(() => !cancelled && setLoading(true));
    Promise.all([
      getGenreMapOnce(),
      fetch("/api/titles/batch", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: refs.map(({ tmdbId, mediaType }) => ({ tmdbId, mediaType })) }) }).then((response) => response.json() as Promise<MediaItem[]>),
    ]).then(([genreMap, items]) => {
      if (cancelled) return;
      const percentByKey = new Map(refs.map((ref) => [`${ref.mediaType}-${ref.tmdbId}`, ref.percent]));
      setTitles(items.map((item) => {
        const title = toPresentationTitleClient(item, genreMap);
        const percent = percentByKey.get(`${item.mediaType}-${item.id}`);
        return percent !== undefined ? { ...title, progress: { percent } } : title;
      }));
    }).catch(() => !cancelled && setTitles([])).finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { titles, loading };
}
