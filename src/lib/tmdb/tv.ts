import { tmdbFetch } from "./client";
import type { TmdbMedia, TmdbPage, TmdbSeasonDetails } from "./types";

export const getPopularSeries = (page = 1) => tmdbFetch<TmdbPage<TmdbMedia>>(`/tv/popular?page=${page}`, 900);
export const getTopRatedSeries = (page = 1) => tmdbFetch<TmdbPage<TmdbMedia>>(`/tv/top_rated?page=${page}`, 1800);
export const getOnTheAirSeries = (page = 1) => tmdbFetch<TmdbPage<TmdbMedia>>(`/tv/on_the_air?page=${page}`, 600);
export const getAiringTodaySeries = (page = 1) => tmdbFetch<TmdbPage<TmdbMedia>>(`/tv/airing_today?page=${page}`, 600);

const TV_APPEND = "credits,videos,images,recommendations,similar,watch/providers,content_ratings";
export const getSeriesDetails = (id: number) => tmdbFetch<TmdbMedia>(`/tv/${id}?append_to_response=${TV_APPEND}&include_image_language=en,null`, 1800);

export const getSeasonDetails = (seriesId: number, seasonNumber: number) =>
  tmdbFetch<TmdbSeasonDetails>(`/tv/${seriesId}/season/${seasonNumber}`, 1800);
