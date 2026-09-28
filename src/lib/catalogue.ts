import { getGenreMap } from "@/lib/tmdb/genres";
import { getPosterUrl, getBackdropUrl } from "@/lib/tmdb/client";
import type { MediaDetails, MediaItem } from "@/lib/tmdb/types";
import type { ContentRowData, FeaturedTitle, MediaTitle } from "@/lib/types";

function genreNames(genreIds: number[], genreMap: Map<number, string>): string[] {
  return genreIds.map((id) => genreMap.get(id)).filter((name): name is string => Boolean(name));
}

/** Match % is only meaningful once TMDB has real votes behind it — never shown for a zero-vote title. */
function matchFor(item: MediaItem): number | null {
  return item.voteCount > 0 ? Math.round(item.voteAverage * 10) : null;
}

/** List-level normalization (rows, search, recommendations): certification/runtime/seasons are not
 * present on TMDB list responses, so they are left null rather than guessed. */
export function toPresentationTitle(item: MediaItem, genreMap: Map<number, string>): MediaTitle {
  return {
    id: `${item.mediaType}-${item.id}`,
    name: item.title,
    kind: item.mediaType === "tv" ? "series" : "movie",
    posterUrl: getPosterUrl(item.posterPath ?? item.backdropPath),
    backdropUrl: getBackdropUrl(item.backdropPath ?? item.posterPath),
    logoUrl: null,
    overview: item.overview || null,
    match: matchFor(item),
    certification: null,
    runtimeMinutes: null,
    seasons: null,
    genres: genreNames(item.genreIds, genreMap),
    year: Number(item.releaseDate?.slice(0, 4)) || null,
  };
}

/** Detail-level normalization: everything list-level data can't provide (certification, runtime,
 * season count, logo art) is filled in from a real title-detail fetch. */
export function toDetailedPresentationTitle(details: MediaDetails): MediaTitle {
  const genreMap = new Map(details.genres.map((genre) => [genre.id, genre.name]));
  const base = toPresentationTitle(details, genreMap);
  return {
    ...base,
    logoUrl: details.logoUrl,
    certification: details.certification,
    runtimeMinutes: details.mediaType === "movie" ? details.runtime : null,
    seasons: details.mediaType === "tv" ? (details.numberOfSeasons ?? null) : null,
  };
}

export async function toPresentationRows(rows: Array<{ title: string; items: MediaItem[]; variant?: ContentRowData["variant"] }>): Promise<ContentRowData[]> {
  const genreMap = await getGenreMap();
  return rows.map((row) => ({ ...row, items: row.items.filter((item) => item.posterPath || item.backdropPath).map((item) => toPresentationTitle(item, genreMap)) }));
}

export async function toFeaturedTitle(details: MediaDetails): Promise<FeaturedTitle> {
  return { title: toDetailedPresentationTitle(details), description: details.overview };
}
