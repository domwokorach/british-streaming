import "server-only";

import { env } from "@/lib/env";

export const TMDB_IMAGE_BASE_URL = process.env.TMDB_IMAGE_BASE_URL ?? "https://image.tmdb.org/t/p";

export async function tmdbFetch<T>(path: string, revalidate: number | false = 900): Promise<T> {
  const url = new URL(`${env.tmdbBaseUrl}${path}`);
  url.searchParams.set("language", env.tmdbLanguage);
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${env.tmdbReadToken}`, accept: "application/json" },
    next: revalidate === false ? { revalidate: 0 } : { revalidate },
  });
  if (!response.ok) throw new Error(`TMDB request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export function getPosterUrl(path: string | null, size = "w780") {
  return path ? `${TMDB_IMAGE_BASE_URL}/${size}${path}` : null;
}

export const getBackdropUrl = (path: string | null, size = "w1280") => getPosterUrl(path, size);
export const getProfileUrl = (path: string | null, size = "w185") => getPosterUrl(path, size);
export const tmdbImage = getPosterUrl;
