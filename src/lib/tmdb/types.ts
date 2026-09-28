export interface TmdbGenre { id: number; name: string; }

export interface TmdbImage { file_path: string; width: number; height: number; aspect_ratio: number; }

export interface TmdbProvider { provider_id: number; provider_name: string; logo_path: string | null; display_priority?: number; }

export interface TmdbWatchProviderRegion { link?: string; flatrate?: TmdbProvider[]; rent?: TmdbProvider[]; buy?: TmdbProvider[]; }

export interface TmdbSeasonSummary { id: number; season_number: number; name: string; overview: string; episode_count: number; air_date: string | null; poster_path: string | null; }

export interface TmdbEpisode { id: number; episode_number: number; season_number: number; name: string; overview: string; still_path: string | null; air_date: string | null; runtime: number | null; vote_average: number; }

export interface TmdbSeasonDetails extends TmdbSeasonSummary { episodes: TmdbEpisode[]; }

export interface TmdbCredits {
  cast: Array<{ id: number; name: string; character: string; profile_path: string | null; order: number }>;
  crew: Array<{ id: number; name: string; job: string; department: string; profile_path: string | null }>;
}

export interface TmdbVideo { id: string; key: string; site: string; type: string; name: string; official?: boolean; }

export interface TmdbMedia {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count?: number;
  popularity?: number;
  genre_ids?: number[];
  genres?: TmdbGenre[];
  runtime?: number;
  episode_run_time?: number[];
  status?: string;
  tagline?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: TmdbSeasonSummary[];
  created_by?: Array<{ id: number; name: string; profile_path: string | null }>;
  credits?: TmdbCredits;
  videos?: { results: TmdbVideo[] };
  images?: { backdrops: TmdbImage[]; posters: TmdbImage[]; logos?: TmdbImage[] };
  recommendations?: TmdbPage<TmdbMedia>;
  similar?: TmdbPage<TmdbMedia>;
  "watch/providers"?: { results: Record<string, TmdbWatchProviderRegion> };
  release_dates?: { results: Array<{ iso_3166_1: string; release_dates: Array<{ certification: string; type: number }> }> };
  content_ratings?: { results: Array<{ iso_3166_1: string; rating: string }> };
}

export interface TmdbPage<T> { page: number; results: T[]; total_pages: number; total_results: number; }

export interface TmdbPerson {
  id: number;
  name: string;
  biography?: string;
  profile_path: string | null;
  known_for_department?: string;
  birthday?: string | null;
  place_of_birth?: string | null;
  combined_credits?: { cast: TmdbMedia[]; crew: TmdbMedia[] };
}

export interface TmdbConfiguration {
  images: { base_url: string; secure_base_url: string; backdrop_sizes: string[]; poster_sizes: string[]; profile_sizes: string[]; logo_sizes: string[] };
}

/** Filters accepted by /discover/movie and /discover/tv (a subset, snake_case as TMDB expects). */
export interface DiscoverFilters {
  page?: number;
  sort_by?: string;
  region?: string;
  with_genres?: string;
  without_genres?: string;
  with_keywords?: string;
  with_watch_providers?: string;
  watch_region?: string;
  with_origin_country?: string;
  with_original_language?: string;
  "vote_average.gte"?: number;
  "vote_count.gte"?: number;
  "primary_release_date.gte"?: string;
  "primary_release_date.lte"?: string;
  "first_air_date.gte"?: string;
  "first_air_date.lte"?: string;
  include_adult?: boolean;
}

/**
 * The canonical, UI-facing media shape. Every TMDB response is normalized into this before it
 * reaches a component — no component should read raw TMDB snake_case fields directly.
 */
export type MediaItem = {
  id: number;
  mediaType: "movie" | "tv";
  title: string;
  originalTitle?: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null;
  voteAverage: number;
  voteCount: number;
  popularity?: number;
  genreIds: number[];
};

export interface WatchProviderInfo {
  region: string;
  link: string | null;
  flatrate: TmdbProvider[];
  rent: TmdbProvider[];
  buy: TmdbProvider[];
  availableOnNetflix: boolean;
}

export interface CastMember { id: number; name: string; character: string; profilePath: string | null; }
export interface CrewMember { id: number; name: string; job: string; profilePath: string | null; }

export interface MediaDetails extends MediaItem {
  runtime: number | null;
  status?: string;
  tagline?: string;
  genres: TmdbGenre[];
  certification: string | null;
  cast: CastMember[];
  directors: CrewMember[];
  creators: Array<{ id: number; name: string; profilePath: string | null }>;
  trailerKey: string | null;
  logoUrl: string | null;
  recommendations: MediaItem[];
  similar: MediaItem[];
  watchProviders: WatchProviderInfo | null;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  seasons?: TmdbSeasonSummary[];
}
