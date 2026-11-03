"use client";

import Image from "next/image";
import { useState } from "react";
import { Clapperboard, Play } from "lucide-react";

import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRuntime } from "@/components/content/media-metadata";
import { useSeasonEpisodes } from "@/hooks/use-season-episodes";
import { getPosterUrl } from "@/lib/tmdb-image";
import type { TmdbSeasonSummary } from "@/lib/tmdb/types";
import type { MediaTitle, ViewingProgress } from "@/lib/types";
import { usePlayback } from "@/providers/playback-provider";

interface EpisodesSectionProps {
  seriesId: number;
  seasons: TmdbSeasonSummary[];
  progress?: ViewingProgress;
  /** Used for the Play affordance: playback is the series trailer until episode video sources exist. */
  title: MediaTitle;
}

/** Real season/episode browser: a season picker plus that season's real episode list from TMDB — never fabricated. */
export function EpisodesSection({ seriesId, seasons, progress, title }: EpisodesSectionProps) {
  const { playMedia } = usePlayback();
  const selectableSeasons = seasons.filter((season) => season.episode_count > 0);
  const defaultSeason = selectableSeasons.find((season) => season.season_number === (progress?.seasonNumber ?? 1)) ?? selectableSeasons.find((season) => season.season_number > 0) ?? selectableSeasons[0];
  const [seasonNumber, setSeasonNumber] = useState<number | null>(defaultSeason?.season_number ?? null);
  const { season, loading } = useSeasonEpisodes(seriesId, seasonNumber);

  if (selectableSeasons.length === 0) return null;

  return (
    <div className="pt-2">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-white">Episodes</h2>
        {selectableSeasons.length > 1 ? (
          <NativeSelect aria-label="Select season" value={seasonNumber ?? undefined} onChange={(event) => setSeasonNumber(Number(event.target.value))} className="w-44 border-0 bg-ws-elevated text-white">
            {selectableSeasons.map((s) => <NativeSelectOption key={s.id} value={s.season_number}>{s.name}</NativeSelectOption>)}
          </NativeSelect>
        ) : (
          <span className="text-base text-white">{selectableSeasons[0].name}</span>
        )}
      </div>

      {loading && <div className="space-y-2">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-[88px] w-full bg-white/5" />)}</div>}

      {!loading && season && (
        <ol className="overflow-hidden rounded-[6px]">
          {season.episodes.map((episode) => {
            const isCurrent = progress?.seasonNumber === episode.season_number && progress?.episodeNumber === episode.episode_number;
            const still = getPosterUrl(episode.still_path, "w300");
            return (
              <li key={episode.id} className={`group/ep border-b border-white/10 last:border-b-0 ${isCurrent ? "bg-ws-elevated" : "hover:bg-ws-elevated"} transition-colors duration-200`}>
                <button type="button" onClick={() => playMedia(title)} aria-label={`Play trailer while browsing episode ${episode.episode_number}: ${episode.name}`} className="flex w-full items-center gap-3 p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-white sm:gap-5 sm:p-4">
                  <span className="w-6 shrink-0 text-center text-xl text-ws-text-2 sm:w-8 sm:text-2xl">{episode.episode_number}</span>
                  <span className="relative block aspect-video w-[104px] shrink-0 overflow-hidden rounded-[4px] bg-ws-elevated sm:w-[150px]">
                    {still ? <Image src={still} alt="" fill sizes="150px" className="object-cover" /> : <span className="flex h-full items-center justify-center text-ws-muted"><Clapperboard className="size-5" aria-hidden /></span>}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-200 group-hover/ep:opacity-100 group-focus-within/ep:opacity-100"><span className="flex size-9 items-center justify-center rounded-full border-2 border-white bg-black/50"><Play className="size-4 fill-white text-white" aria-hidden /></span></span>
                    {isCurrent && progress && (
                      <span className="absolute inset-x-0 bottom-0 block h-[3px] bg-white/25"><span className="block h-full bg-ws-blue" style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }} /></span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-semibold text-white sm:text-base">{episode.name}{isCurrent && <span className="ml-2 text-xs font-medium text-ws-text-2">Continue watching</span>}</span>
                      {episode.runtime && <span className="shrink-0 text-sm text-white">{formatRuntime(episode.runtime)}</span>}
                    </span>
                    {episode.overview && <span className="mt-1 line-clamp-2 block text-xs leading-5 text-ws-text-2 sm:text-sm">{episode.overview}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {!loading && !season && <p className="text-xs text-ws-text-2">Episode details for this season are temporarily unavailable.</p>}
    </div>
  );
}
