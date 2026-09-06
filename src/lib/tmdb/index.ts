import "server-only";

import { env } from "@/lib/env";
import { discoverMovies, discoverOnNetflix, discoverTv } from "./discover";
import { getNowPlayingMovies, getPopularMovies, getTopRatedMovies, getUpcomingMovies } from "./movies";
import { getRecommendations, getSimilar } from "./recommendations";
import { toWatchProviderInfo } from "./providers";
import { getPopularSeries, getTopRatedSeries } from "./tv";
import { getTrending } from "./trending";
import { selectTrailer } from "./videos";
import type { CastMember, CrewMember, MediaDetails, MediaItem, TmdbMedia } from "./types";

export function toMediaItem(media: TmdbMedia, mediaType: "movie" | "tv"): MediaItem {
  return {
    id: media.id,
    mediaType,
    title: media.title ?? media.name ?? "Untitled",
    originalTitle: media.original_title ?? media.original_name,
    overview: media.overview,
    posterPath: media.poster_path,
    backdropPath: media.backdrop_path,
    releaseDate: media.release_date ?? media.first_air_date ?? null,
    voteAverage: media.vote_average,
    popularity: media.popularity,
    genreIds: media.genre_ids ?? media.genres?.map((genre) => genre.id) ?? [],
  };
}

function certificationFor(media: TmdbMedia, mediaType: "movie" | "tv", region: string): string | null {
  if (mediaType === "movie") {
    const entry = media.release_dates?.results.find((result) => result.iso_3166_1 === region);
    return entry?.release_dates.find((release) => release.certification)?.certification || null;
  }
  return media.content_ratings?.results.find((result) => result.iso_3166_1 === region)?.rating || null;
}

/** Full normalization for a title-detail page: certification, cast/crew, trailer, providers, recommendations. */
export function toMediaDetails(media: TmdbMedia, mediaType: "movie" | "tv"): MediaDetails {
  const cast: CastMember[] = (media.credits?.cast ?? []).slice(0, 12).map((member) => ({ id: member.id, name: member.name, character: member.character, profilePath: member.profile_path }));
  const directors: CrewMember[] = (media.credits?.crew ?? []).filter((member) => member.job === "Director").map((member) => ({ id: member.id, name: member.name, job: member.job, profilePath: member.profile_path }));
  const creators = (media.created_by ?? []).map((creator) => ({ id: creator.id, name: creator.name, profilePath: creator.profile_path }));
  const watchProvidersRaw = media["watch/providers"]?.results ?? {};

  return {
    ...toMediaItem(media, mediaType),
    runtime: media.runtime ?? media.episode_run_time?.[0] ?? null,
    status: media.status,
    tagline: media.tagline,
    genres: media.genres ?? [],
    certification: certificationFor(media, mediaType, env.tmdbRegion),
    cast,
    directors,
    creators,
    trailerKey: selectTrailer(media.videos?.results ?? []),
    recommendations: (media.recommendations?.results ?? []).map((item) => toMediaItem(item, mediaType)),
    similar: (media.similar?.results ?? []).map((item) => toMediaItem(item, mediaType)),
    watchProviders: toWatchProviderInfo(watchProvidersRaw, env.tmdbRegion),
    numberOfSeasons: media.number_of_seasons,
    numberOfEpisodes: media.number_of_episodes,
    seasons: media.seasons,
  };
}

const normalize = (items: TmdbMedia[], mediaType: "movie" | "tv") => items.map((item) => toMediaItem(item, mediaType));

/** One rail of the homepage: a real, labelled TMDB query — never a fabricated "Netflix" ranking. */
export interface CatalogueRow { title: string; items: MediaItem[]; variant?: "standard" | "top-ten" | "continue-watching"; }

const DOCUMENTARY_GENRE = "99";
const CRIME_GENRE = "80";

export async function getHomepageCatalogue(): Promise<{ featured: MediaItem | null; rows: CatalogueRow[] }> {
  const region = env.tmdbRegion;
  const results = await Promise.allSettled([
    getTrending("movie"),
    getTrending("tv"),
    getPopularMovies(),
    getPopularSeries(),
    getTopRatedMovies(),
    getTopRatedSeries(),
    getUpcomingMovies(),
    getNowPlayingMovies(),
    discoverOnNetflix("movie", region),
    discoverOnNetflix("tv", region),
    discoverTv({ with_genres: DOCUMENTARY_GENRE }),
    discoverMovies({ with_genres: CRIME_GENRE }),
  ]);
  const value = (index: number, mediaType: "movie" | "tv") => {
    const settled = results[index];
    return settled.status === "fulfilled" ? normalize(settled.value.results, mediaType) : [];
  };

  const trendingMovies = value(0, "movie");
  const trendingSeries = value(1, "tv");
  const rows: CatalogueRow[] = [
    { title: `Trending in the ${region}`, items: [...trendingMovies, ...trendingSeries].sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0)) },
    { title: `Popular Films in the ${region}`, items: value(2, "movie"), variant: "top-ten" as const },
    { title: `Popular Series in the ${region}`, items: value(3, "tv"), variant: "top-ten" as const },
    { title: `Popular on Netflix in the ${region}`, items: value(8, "movie") },
    { title: "Only on Netflix: Series", items: value(9, "tv") },
    { title: "Top-Rated Films", items: value(4, "movie") },
    { title: "Top-Rated Series", items: value(5, "tv") },
    { title: "New Releases", items: value(7, "movie") },
    { title: "Coming Soon", items: value(6, "movie") },
    { title: "Documentary Series", items: value(10, "tv") },
    { title: "Crime Films", items: value(11, "movie") },
  ].filter((row) => row.items.length > 0);

  return { featured: trendingMovies.find((item) => item.backdropPath) ?? trendingSeries.find((item) => item.backdropPath) ?? null, rows };
}

/** Recommendation rail for a title-detail page: TMDB's own recommendations, falling back to similar titles. */
export async function getRecommendationRows(mediaType: "movie" | "tv", id: number): Promise<CatalogueRow[]> {
  const [recommendations, similar] = await Promise.allSettled([getRecommendations(mediaType, id), getSimilar(mediaType, id)]);
  const rows: CatalogueRow[] = [];
  if (recommendations.status === "fulfilled" && recommendations.value.results.length > 0) rows.push({ title: "Recommended for You", items: normalize(recommendations.value.results, mediaType) });
  if (similar.status === "fulfilled" && similar.value.results.length > 0) rows.push({ title: "Similar Titles", items: normalize(similar.value.results, mediaType) });
  return rows;
}
