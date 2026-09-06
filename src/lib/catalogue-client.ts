import { getPosterUrl } from "@/lib/tmdb-image";
import type { MediaItem } from "@/lib/tmdb/types";
import type { MediaTitle } from "@/lib/types";

function ratingFor(item: MediaItem): MediaTitle["rating"] {
  if (item.voteAverage >= 8) return "18";
  if (item.voteAverage >= 6) return "15";
  return "12";
}

/** Client-side counterpart to lib/catalogue.ts's toPresentationTitle, for hooks that can't import server-only TMDB code. */
export function toPresentationTitleClient(item: MediaItem, genreMap: Record<number, string>): MediaTitle {
  const names = item.genreIds.map((id) => genreMap[id]).filter((name): name is string => Boolean(name));
  return {
    id: `${item.mediaType}-${item.id}`,
    name: item.title,
    artworkId: getPosterUrl(item.posterPath ?? item.backdropPath) ?? "",
    match: Math.round(item.voteAverage * 10),
    rating: ratingFor(item),
    runtime: item.mediaType === "tv" ? "Series" : "Film",
    genres: (names.length ? names : ["Drama"]) as MediaTitle["genres"],
    year: Number(item.releaseDate?.slice(0, 4)) || new Date().getFullYear(),
    kind: item.mediaType === "tv" ? "series" : "movie",
  };
}
