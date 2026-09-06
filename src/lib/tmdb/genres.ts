import { tmdbFetch } from "./client";
import type { TmdbGenre } from "./types";

/** Genre lists change essentially never — cache for a full day. */
export const getMovieGenres = () => tmdbFetch<{ genres: TmdbGenre[] }>("/genre/movie/list", 86400);
export const getTvGenres = () => tmdbFetch<{ genres: TmdbGenre[] }>("/genre/tv/list", 86400);

let genreMapCache: Promise<Map<number, string>> | null = null;

/** A single id → name lookup across both movie and TV genres, fetched once and cached for the process lifetime. */
export function getGenreMap(): Promise<Map<number, string>> {
  if (!genreMapCache) {
    genreMapCache = Promise.all([getMovieGenres(), getTvGenres()])
      .then(([movies, tv]) => new Map([...movies.genres, ...tv.genres].map((genre) => [genre.id, genre.name])))
      .catch(() => new Map());
  }
  return genreMapCache;
}
