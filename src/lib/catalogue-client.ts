import { getPosterUrl } from "@/lib/tmdb-image";
import type { MediaItem } from "@/lib/tmdb/types";
import type { MediaTitle } from "@/lib/types";

/** Client-side counterpart to lib/catalogue.ts's toPresentationTitle, for hooks that can't import server-only TMDB code. */
export function toPresentationTitleClient(item: MediaItem, genreMap: Record<number, string>): MediaTitle {
  const genres = item.genreIds.map((id) => genreMap[id]).filter((name): name is string => Boolean(name));
  return {
    id: `${item.mediaType}-${item.id}`,
    name: item.title,
    kind: item.mediaType === "tv" ? "series" : "movie",
    posterUrl: getPosterUrl(item.posterPath ?? item.backdropPath),
    backdropUrl: getPosterUrl(item.backdropPath ?? item.posterPath, "w1280"),
    logoUrl: null,
    overview: item.overview || null,
    match: item.voteCount > 0 ? Math.round(item.voteAverage * 10) : null,
    certification: null,
    runtimeMinutes: null,
    seasons: null,
    genres,
    year: Number(item.releaseDate?.slice(0, 4)) || null,
  };
}
