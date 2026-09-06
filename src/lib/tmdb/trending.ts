import { tmdbFetch } from "./client";
import type { TmdbMedia, TmdbPage } from "./types";

export const getTrending = (mediaType: "all" | "movie" | "tv" = "all") => tmdbFetch<TmdbPage<TmdbMedia>>(`/trending/${mediaType}/day`, 300);
export const getGenres = (mediaType: "movie" | "tv") => tmdbFetch<{ genres: Array<{ id: number; name: string }> }>(`/genre/${mediaType}/list`, 86400);
