"use client";

import { useEffect, useState } from "react";

let genreMapPromise: Promise<Record<number, string>> | null = null;
function fetchGenreMapOnce() {
  if (!genreMapPromise) genreMapPromise = fetch("/api/genres").then((response) => response.json());
  return genreMapPromise;
}

/** The client-safe id -> name genre lookup, fetched once per session and shared across every consumer. */
export function useGenreMap() {
  const [genreMap, setGenreMap] = useState<Record<number, string>>({});

  useEffect(() => {
    let cancelled = false;
    fetchGenreMapOnce().then((map) => !cancelled && setGenreMap(map));
    return () => {
      cancelled = true;
    };
  }, []);

  return genreMap;
}
