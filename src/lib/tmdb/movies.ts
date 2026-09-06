import { tmdbFetch } from "./client";
import type { TmdbMedia, TmdbPage } from "./types";

export const getPopularMovies = (page = 1) => tmdbFetch<TmdbPage<TmdbMedia>>(`/movie/popular?page=${page}`, 900);
export const getNowPlayingMovies = (page = 1) => tmdbFetch<TmdbPage<TmdbMedia>>(`/movie/now_playing?page=${page}`, 600);
export const getUpcomingMovies = (page = 1) => tmdbFetch<TmdbPage<TmdbMedia>>(`/movie/upcoming?page=${page}`, 600);
export const getTopRatedMovies = (page = 1) => tmdbFetch<TmdbPage<TmdbMedia>>(`/movie/top_rated?page=${page}`, 1800);

const MOVIE_APPEND = "credits,videos,images,recommendations,similar,watch/providers,release_dates";
export const getMovieDetails = (id: number) => tmdbFetch<TmdbMedia>(`/movie/${id}?append_to_response=${MOVIE_APPEND}`, 1800);
