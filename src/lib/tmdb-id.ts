import type { MediaTitle } from "@/lib/types";

/** MediaTitle.id is always the composite `${mediaType}-${tmdbId}` produced by toPresentationTitle. */
export function parseCompositeId(id: string): { mediaType: "movie" | "tv"; tmdbId: number } | null {
  const match = id.match(/^(movie|tv)-(\d+)$/);
  return match ? { mediaType: match[1] as "movie" | "tv", tmdbId: Number(match[2]) } : null;
}

export function compositeId(mediaType: "movie" | "tv", tmdbId: number) {
  return `${mediaType}-${tmdbId}`;
}

export function toMediaType(title: Pick<MediaTitle, "kind">): "movie" | "tv" {
  return title.kind === "series" ? "tv" : "movie";
}
