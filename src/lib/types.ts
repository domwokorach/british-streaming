export interface ViewingProgress {
  percent: number;
  seasonNumber?: number;
  episodeNumber?: number;
}

/**
 * The canonical, card-facing title shape. Every field is either always present in TMDB list
 * responses (id, name, artwork, overview, genres, year) or explicitly optional because it is
 * only known once we have fetched full details (certification, runtime, seasons, logo) — never
 * fabricated. Consumers must hide a field when it is null/undefined rather than guess a value.
 */
export interface MediaTitle {
  id: string;
  name: string;
  kind: "movie" | "series";
  posterUrl: string | null;
  backdropUrl: string | null;
  logoUrl: string | null;
  overview: string | null;
  /** Rounded vote_average * 10, shown as "Match" — only meaningful when voteCount > 0. */
  match: number | null;
  /** Real certification (e.g. "15", "TV-MA") from TMDB release_dates/content_ratings. Only present on detail-level data. */
  certification: string | null;
  /** Movies only, minutes. Only present on detail-level data. */
  runtimeMinutes: number | null;
  /** Series only. Only present on detail-level data. */
  seasons: number | null;
  genres: string[];
  year: number | null;
  progress?: ViewingProgress;
}

export interface ContentRowData {
  title: string;
  items: MediaTitle[];
  variant?: "standard" | "top-ten" | "continue-watching";
}

export interface FeaturedTitle {
  title: MediaTitle;
  description: string;
}
