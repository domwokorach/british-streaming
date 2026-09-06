import { env } from "@/lib/env";
import { tmdbFetch } from "./client";
import type { TmdbWatchProviderRegion, WatchProviderInfo } from "./types";

const NETFLIX_PROVIDER_ID = 8;

export const getWatchProviders = (mediaType: "movie" | "tv", id: number) =>
  tmdbFetch<{ results: Record<string, TmdbWatchProviderRegion> }>(`/${mediaType}/${id}/watch/providers`, 3600);

/** Picks out the single region (default GB) we show in the UI, plus whether Netflix carries it there. */
export function toWatchProviderInfo(results: Record<string, TmdbWatchProviderRegion>, region = env.tmdbRegion): WatchProviderInfo | null {
  const regional = results[region];
  if (!regional) return null;
  const flatrate = regional.flatrate ?? [];
  return {
    region,
    link: regional.link ?? null,
    flatrate,
    rent: regional.rent ?? [],
    buy: regional.buy ?? [],
    availableOnNetflix: flatrate.some((provider) => provider.provider_id === NETFLIX_PROVIDER_ID),
  };
}
