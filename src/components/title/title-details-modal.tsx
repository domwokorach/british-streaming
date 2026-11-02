"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type ReactElement, type ReactNode } from "react";
import { Clapperboard } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { MediaGenres } from "@/components/content/media-genres";
import { MediaMetadata } from "@/components/content/media-metadata";
import { EpisodesSection } from "./episodes-section";
import { useGenreMap } from "@/hooks/use-genre-map";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useTitleDetails } from "@/hooks/use-title-details";
import { toPresentationTitleClient } from "@/lib/catalogue-client";
import { getBackdropUrl } from "@/lib/tmdb-image";
import { parseCompositeId } from "@/lib/tmdb-id";
import type { MediaTitle } from "@/lib/types";
import { TitleActionButtons } from "./action-buttons";

const SYNOPSIS_COLLAPSE_LENGTH = 240;

/** Wraps its trigger(s) — usually the card artwork and a "More Info" button — in a single Dialog/Sheet
 * root so either one opens the same cinematic details panel. Fetches full title details lazily, only
 * once the panel is actually open. */
export function TitleDetails({ title, children }: { title: MediaTitle; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const accessibleDescription = title.overview ?? `${title.name}, a ${title.kind === "series" ? "series" : "film"}.`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children}
      {isDesktop ? (
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto overflow-x-hidden border-white/10 bg-[#16275a] p-0 text-white sm:max-w-2xl">
          <DialogTitle className="sr-only">{title.name}</DialogTitle>
          <DialogDescription className="sr-only">{accessibleDescription}</DialogDescription>
          <TitleDetailsBody title={title} open={open} />
        </DialogContent>
      ) : (
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto overflow-x-hidden border-white/10 bg-[#16275a] p-0 text-white">
          <SheetTitle className="sr-only">{title.name}</SheetTitle>
          <SheetDescription className="sr-only">{accessibleDescription}</SheetDescription>
          <TitleDetailsBody title={title} open={open} />
        </SheetContent>
      )}
    </Dialog>
  );
}

/** Backwards-compatible single-trigger convenience wrapper: `renderTrigger` is the element that becomes
 * the clickable trigger (e.g. a Button), `children` are its contents (icon + label). */
export function TitleDetailsModal({ title, renderTrigger, children }: { title: MediaTitle; renderTrigger: ReactElement; children?: ReactNode }) {
  return (
    <TitleDetails title={title}>
      <DialogTrigger render={renderTrigger}>{children}</DialogTrigger>
    </TitleDetails>
  );
}

function TitleDetailsBody({ title, open }: { title: MediaTitle; open: boolean }) {
  const parsed = parseCompositeId(title.id);
  const { details, loading } = useTitleDetails(parsed?.mediaType ?? null, parsed?.tmdbId ?? null, open);
  const genreMap = useGenreMap();
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [castExpanded, setCastExpanded] = useState(false);

  const merged: MediaTitle = useMemo(() => {
    if (!details) return title;
    return {
      ...title,
      overview: details.overview || title.overview,
      logoUrl: details.logoUrl ?? title.logoUrl,
      certification: details.certification,
      runtimeMinutes: details.mediaType === "movie" ? details.runtime : null,
      seasons: details.mediaType === "tv" ? (details.numberOfSeasons ?? null) : null,
      genres: details.genres.length > 0 ? details.genres.map((genre) => genre.name) : title.genres,
      backdropUrl: getBackdropUrl(details.backdropPath) ?? title.backdropUrl,
    };
  }, [details, title]);

  const backdrop = merged.backdropUrl;
  const overview = merged.overview;
  const showReadMore = Boolean(overview && overview.length > SYNOPSIS_COLLAPSE_LENGTH);
  const cast = details?.cast ?? [];
  const visibleCast = castExpanded ? cast : cast.slice(0, 6);
  const director = details?.directors[0]?.name;
  const creators = details?.creators.map((creator) => creator.name).join(", ");
  const recommendations = (details?.recommendations.length ? details.recommendations : (details?.similar ?? [])).slice(0, 12);
  const hasCrewInfo = cast.length > 0 || Boolean(director) || Boolean(creators);

  return (
    <div>
      <div className="relative h-[38vh] min-h-[220px] shrink-0 bg-zinc-900">
        {backdrop ? (
          <Image src={backdrop} alt="" fill priority sizes="720px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-700"><Clapperboard className="size-10" aria-hidden /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#16275a] via-[#16275a]/30 to-transparent" />
        <div className="absolute inset-x-6 bottom-4">
          {merged.logoUrl ? (
            <div className="relative h-14 w-3/4 max-w-sm sm:h-20">
              <Image src={merged.logoUrl} alt={merged.name} fill sizes="360px" className="object-contain object-left-bottom drop-shadow-lg" />
            </div>
          ) : (
            <h1 className="text-2xl font-semibold tracking-tight text-white drop-shadow-lg sm:text-4xl">{merged.name}</h1>
          )}
        </div>
      </div>

      <div className="space-y-5 px-6 pb-8 pt-5">
        <TitleActionButtons title={merged} />

        <MediaMetadata title={merged} />

        {loading && !overview ? (
          <Skeleton className="h-16 w-full max-w-3xl bg-white/5" />
        ) : overview ? (
          <div className="max-w-3xl">
            <p className={`text-sm leading-6 text-zinc-200 transition-all duration-300 md:text-base md:leading-7 ${showReadMore && !synopsisExpanded ? "line-clamp-4" : ""}`}>{overview}</p>
            {showReadMore && (
              <button type="button" onClick={() => setSynopsisExpanded((value) => !value)} className="mt-1.5 text-sm font-semibold text-zinc-300 underline-offset-2 hover:text-white hover:underline">
                {synopsisExpanded ? "Read Less" : "Read More"}
              </button>
            )}
          </div>
        ) : null}

        <MediaGenres genres={merged.genres} className="text-sm text-zinc-400" />

        {loading ? (
          <Skeleton className="h-10 w-2/3 bg-white/5" />
        ) : hasCrewInfo ? (
          <div className="space-y-1 text-sm text-zinc-300">
            {cast.length > 0 && (
              <p>
                <span className="text-zinc-500">Cast: </span>
                {visibleCast.map((member) => member.name).join(", ")}
                {cast.length > 6 && (
                  <button type="button" onClick={() => setCastExpanded((value) => !value)} className="ml-2 font-semibold text-zinc-400 hover:text-white">
                    {castExpanded ? "Less" : "More"}
                  </button>
                )}
              </p>
            )}
            {details?.mediaType === "movie" && director && <p><span className="text-zinc-500">Director: </span>{director}</p>}
            {details?.mediaType === "tv" && creators && <p><span className="text-zinc-500">Creators: </span>{creators}</p>}
          </div>
        ) : null}

        {details?.mediaType === "tv" && parsed && details.seasons && details.seasons.length > 0 && (
          <EpisodesSection seriesId={parsed.tmdbId} seasons={details.seasons} progress={title.progress} />
        )}

        {recommendations.length > 0 && (
          <div className="pt-2">
            <h2 className="mb-3 text-lg font-semibold text-white">More Like This</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {recommendations.map((item) => {
                const presented = toPresentationTitleClient(item, genreMap);
                return (
                  <Link key={`${item.mediaType}-${item.id}`} href={`/title/${item.mediaType}/${item.id}`} className="group/rec overflow-hidden rounded-sm bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
                    <div className="relative aspect-video">
                      {presented.backdropUrl ? (
                        <Image src={presented.backdropUrl} alt="" fill sizes="240px" className="object-cover transition-transform duration-200 group-hover/rec:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-zinc-600"><Clapperboard className="size-5" aria-hidden /></div>
                      )}
                    </div>
                    <p className="truncate px-2 py-1.5 text-xs text-zinc-200">{presented.name}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {!loading && !details && <p className="text-xs text-zinc-500">Full details for this title are temporarily unavailable.</p>}
      </div>
    </div>
  );
}
