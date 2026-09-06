import { tmdbFetch } from "./client";
import type { TmdbMedia, TmdbPage } from "./types";

export const getRecommendations = (mediaType: "movie" | "tv", id: number) =>
  tmdbFetch<TmdbPage<TmdbMedia>>(`/${mediaType}/${id}/recommendations`, 3600);

export const getSimilar = (mediaType: "movie" | "tv", id: number) =>
  tmdbFetch<TmdbPage<TmdbMedia>>(`/${mediaType}/${id}/similar`, 3600);
