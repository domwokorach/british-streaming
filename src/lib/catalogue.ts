import { getGenreMap } from "@/lib/tmdb/genres";
import { getPosterUrl, getBackdropUrl } from "@/lib/tmdb/client";
import type { MediaItem } from "@/lib/tmdb/types";
import type { ContentRowData, FeaturedTitle, MediaTitle } from "@/lib/types";

function ratingFor(item: MediaItem): MediaTitle["rating"] {
  if (item.voteAverage >= 8) return "18";
  if (item.voteAverage >= 6) return "15";
  return "12";
}

function genreNames(genreIds: number[], genreMap: Map<number, string>): MediaTitle["genres"] {
  const names = genreIds.map((id) => genreMap.get(id)).filter((name): name is string => Boolean(name));
  return (names.length ? names : ["Drama"]) as MediaTitle["genres"];
}

export function toPresentationTitle(item: MediaItem, genreMap: Map<number, string>): MediaTitle {
  return {
    id: `${item.mediaType}-${item.id}`,
    name: item.title,
    artworkId: getPosterUrl(item.posterPath ?? item.backdropPath) ?? "",
    match: Math.round(item.voteAverage * 10),
    rating: ratingFor(item),
    runtime: item.mediaType === "tv" ? "Series" : "Film",
    genres: genreNames(item.genreIds, genreMap),
    year: Number(item.releaseDate?.slice(0, 4)) || new Date().getFullYear(),
    kind: item.mediaType === "tv" ? "series" : "movie",
  };
}

export async function toPresentationRows(rows: Array<{ title: string; items: MediaItem[]; variant?: ContentRowData["variant"] }>): Promise<ContentRowData[]> {
  const genreMap = await getGenreMap();
  return rows.map((row) => ({ ...row, items: row.items.filter((item) => item.posterPath || item.backdropPath).map((item) => toPresentationTitle(item, genreMap)) }));
}

export async function toFeaturedTitle(item: MediaItem): Promise<FeaturedTitle> {
  const genreMap = await getGenreMap();
  const title = toPresentationTitle(item, genreMap);
  return { title, backdropId: getBackdropUrl(item.backdropPath) ?? title.artworkId, description: item.overview };
}
