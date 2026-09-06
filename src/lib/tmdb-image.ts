// Client-safe image URL helpers. `image.tmdb.org` is TMDB's fixed public CDN — no secret involved —
// so, unlike src/lib/tmdb/client.ts, this file carries no "server-only" import.
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

export function getPosterUrl(path: string | null, size = "w780") {
  return path ? `${TMDB_IMAGE_BASE_URL}/${size}${path}` : null;
}

export const getBackdropUrl = (path: string | null, size = "w1280") => getPosterUrl(path, size);
export const getProfileUrl = (path: string | null, size = "w185") => getPosterUrl(path, size);
