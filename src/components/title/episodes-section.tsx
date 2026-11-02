"use client";

import Image from "next/image";
import { useState } from "react";
import { Clapperboard } from "lucide-react";

import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRuntime } from "@/components/content/media-metadata";
import { useSeasonEpisodes } from "@/hooks/use-season-episodes";
import { getPosterUrl } from "@/lib/tmdb-image";
import type { TmdbSeasonSummary } from "@/lib/tmdb/types";
import type { ViewingProgress } from "@/lib/types";

interface EpisodesSectionProps {
  seriesId: number;
  seasons: TmdbSeasonSummary[];
  progress?: ViewingProgress;
}

/** Real season/episode browser: a season picker plus that season's real episode list from TMDB — never fabricated. */
export function EpisodesSection({ seriesId, seasons, progress }: EpisodesSectionProps) {
  const selectableSeasons = seasons.filter((season) => season.episode_count > 0);
  const defaultSeason = selectableSeasons.find((season) => season.season_number === (progress?.seasonNumber ?? 1)) ?? selectableSeasons.find((season) => season.season_number > 0) ?? selectableSeasons[0];
  const [seasonNumber, setSeasonNumber] = useState<number | null>(defaultSeason?.season_number ?? null);
  const { season, loading } = useSeasonEpisodes(seriesId, seasonNumber);

  if (selectableSeasons.length === 0) return null;

  return (
    <div className="pt-2">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Episodes</h2>
        {selectableSeasons.length > 1 && (
          <NativeSelect
            aria-label="Select season"
            value={seasonNumber ?? undefined}
            onChange={(event) => setSeasonNumber(Number(event.target.value))}
            className="w-40"
          >
            {selectableSeasons.map((s) => (
              <NativeSelectOption key={s.id} value={s.season_number}>{s.name}</NativeSelectOption>
            ))}
          </NativeSelect>
        )}
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-20 w-full bg-white/5" />)}
        </div>
      )}

      {!loading && season && (
        <ul className="space-y-4">
          {season.episodes.map((episode) => {
            const isCurrent = progress?.seasonNumber === episode.season_number && progress?.episodeNumber === episode.episode_number;
            const still = getPosterUrl(episode.still_path, "w300");
            return (
              <li key={episode.id} className="flex gap-3">
                <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded bg-zinc-800 sm:w-40">
                  {still ? (
                    <Image src={still} alt="" fill sizes="160px" className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-zinc-600"><Clapperboard className="size-5" aria-hidden /></div>
                  )}
                  {isCurrent && progress && (
                    <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/25">
                      <div className="h-full bg-[#7c3aed]" style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <p className="text-sm font-medium text-white">{episode.episode_number}. {episode.name}</p>
                    {episode.runtime && <span className="text-xs text-zinc-500">{formatRuntime(episode.runtime)}</span>}
                    {isCurrent && <span className="text-xs font-semibold text-zinc-400">Continue Watching</span>}
                  </div>
                  {episode.air_date && <p className="text-xs text-zinc-500">{episode.air_date}</p>}
                  {episode.overview && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-400">{episode.overview}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!loading && !season && <p className="text-xs text-zinc-500">Episode details for this season are temporarily unavailable.</p>}
    </div>
  );
}
