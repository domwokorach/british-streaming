import { tmdbFetch } from "./client";
import type { TmdbVideo } from "./types";

export async function getVideos(type: "movie" | "tv", id: number) {
  return tmdbFetch<{ results: TmdbVideo[] }>(`/${type}/${id}/videos`, 1800);
}

export function selectTrailer(videos: TmdbVideo[]) {
  return videos.find((video) => video.site === "YouTube" && video.type === "Trailer" && video.official)?.key
    ?? videos.find((video) => video.site === "YouTube" && video.type === "Trailer")?.key
    ?? videos.find((video) => video.site === "YouTube" && video.type === "Teaser")?.key
    ?? null;
}
