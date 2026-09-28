"use client";

import { useEffect, useState } from "react";

const cache = new Map<string, Promise<string | null>>();

function fetchTrailerKeyOnce(mediaType: "movie" | "tv", tmdbId: number) {
  const key = `${mediaType}-${tmdbId}`;
  let promise = cache.get(key);
  if (!promise) {
    promise = fetch(`/api/title/${mediaType}/${tmdbId}/videos`)
      .then((response) => (response.ok ? response.json() : { trailerKey: null }))
      .then((data: { trailerKey: string | null }) => data.trailerKey)
      .catch(() => null);
    cache.set(key, promise);
  }
  return promise;
}

/** Lazily resolves a title's real YouTube trailer key for the hover preview — never fetched until `enabled`. */
export function useTrailerKey(mediaType: "movie" | "tv" | null, tmdbId: number | null, enabled: boolean) {
  const [trailerKey, setTrailerKey] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !mediaType || tmdbId === null) return;
    let cancelled = false;
    fetchTrailerKeyOnce(mediaType, tmdbId).then((key) => !cancelled && setTrailerKey(key));
    return () => {
      cancelled = true;
    };
  }, [enabled, mediaType, tmdbId]);

  return trailerKey;
}
