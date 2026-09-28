"use client";

import { useEffect, useState } from "react";
import type { MediaDetails } from "@/lib/tmdb/types";

const cache = new Map<string, Promise<MediaDetails | null>>();

function fetchDetailsOnce(mediaType: "movie" | "tv", tmdbId: number) {
  const key = `${mediaType}-${tmdbId}`;
  let promise = cache.get(key);
  if (!promise) {
    promise = fetch(`/api/title/${mediaType}/${tmdbId}`)
      .then((response) => (response.ok ? (response.json() as Promise<MediaDetails>) : null))
      .catch(() => null);
    cache.set(key, promise);
  }
  return promise;
}

/** Fetches the full, real title details (cast, certification, runtime, seasons, trailer, recommendations)
 * behind a title. Only call this once a user has actually asked to see more (e.g. a details panel opened) —
 * never eagerly for every card in a row. */
export function useTitleDetails(mediaType: "movie" | "tv" | null, tmdbId: number | null, enabled: boolean) {
  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !mediaType || tmdbId === null) return;
    let cancelled = false;
    queueMicrotask(() => !cancelled && setLoading(true));
    fetchDetailsOnce(mediaType, tmdbId).then((result) => {
      if (cancelled) return;
      setDetails(result);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, mediaType, tmdbId]);

  return { details, loading };
}
