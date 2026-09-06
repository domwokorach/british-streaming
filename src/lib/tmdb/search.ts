import { tmdbFetch } from "./client";
import type { TmdbMedia, TmdbPage } from "./types";

export const searchTitles = (query: string) => tmdbFetch<TmdbPage<TmdbMedia>>(`/search/multi?query=${encodeURIComponent(query)}&include_adult=false`, false);
