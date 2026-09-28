"use client";

import { useEffect, useState } from "react";
import type { TmdbSeasonDetails } from "@/lib/tmdb/types";

const cache = new Map<string, Promise<TmdbSeasonDetails | null>>();

function fetchSeasonOnce(seriesId: number, seasonNumber: number) {
  const key = `${seriesId}-${seasonNumber}`;
  let promise = cache.get(key);
  if (!promise) {
    promise = fetch(`/api/title/tv/${seriesId}/season/${seasonNumber}`)
      .then((response) => (response.ok ? (response.json() as Promise<TmdbSeasonDetails>) : null))
      .catch(() => null);
    cache.set(key, promise);
  }
  return promise;
}

/** Real episode list for one season — only fetched once a season is actually selected. */
export function useSeasonEpisodes(seriesId: number | null, seasonNumber: number | null) {
  const [season, setSeason] = useState<TmdbSeasonDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (seriesId === null || seasonNumber === null) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setSeason(null);
      setLoading(true);
    });
    fetchSeasonOnce(seriesId, seasonNumber).then((result) => {
      if (cancelled) return;
      setSeason(result);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [seriesId, seasonNumber]);

  return { season, loading };
}
