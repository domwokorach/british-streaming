import { env } from "@/lib/env";
import { tmdbFetch } from "./client";
import type { DiscoverFilters, TmdbMedia, TmdbPage } from "./types";

function buildQuery(filters: DiscoverFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    params.set(key, String(value));
  }
  return params.toString();
}

export const discoverMovies = (filters: DiscoverFilters = {}, revalidate = 3600) =>
  tmdbFetch<TmdbPage<TmdbMedia>>(`/discover/movie?${buildQuery({ sort_by: "popularity.desc", region: env.tmdbRegion, ...filters })}`, revalidate);

export const discoverTv = (filters: DiscoverFilters = {}, revalidate = 3600) =>
  tmdbFetch<TmdbPage<TmdbMedia>>(`/discover/tv?${buildQuery({ sort_by: "popularity.desc", ...filters })}`, revalidate);

/** Titles with a Netflix (provider 8) offering in the given region. */
export const discoverOnNetflix = (mediaType: "movie" | "tv", region = env.tmdbRegion, revalidate = 3600) =>
  (mediaType === "movie" ? discoverMovies : discoverTv)({ with_watch_providers: "8", watch_region: region }, revalidate);
