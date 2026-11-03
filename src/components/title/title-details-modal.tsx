"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type ReactElement, type ReactNode } from "react";
import { Clapperboard, Volume2, VolumeX, X } from "lucide-react";
import { useReducedMotion } from "motion/react";

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRuntime } from "@/components/content/media-metadata";
import { EpisodesSection } from "./episodes-section";
import { useGenreMap } from "@/hooks/use-genre-map";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useTitleDetails } from "@/hooks/use-title-details";
import { useTrailerKey } from "@/hooks/use-trailer-key";
import { HoverPreview } from "@/components/content/hover-preview";
import { toPresentationTitleClient } from "@/lib/catalogue-client";
import { getBackdropUrl } from "@/lib/tmdb-image";
import { parseCompositeId } from "@/lib/tmdb-id";
import type { MediaTitle } from "@/lib/types";
import { TitleActionButtons } from "./action-buttons";

const SYNOPSIS_COLLAPSE_LENGTH = 240;

/** Wraps its trigger(s) — usually the card artwork and a "More Info" button — in a single Dialog/Sheet
 * root so either one opens the same cinematic details panel. Fetches full title details lazily, only
 * once the panel is actually open. */
export function TitleDetails({ title, children, onOpenChange }: { title: MediaTitle; children: ReactNode; onOpenChange?: (open: boolean) => void }) {
  const [open, setOpenState] = useState(false);
  const setOpen = (next: boolean) => { setOpenState(next); onOpenChange?.(next); };
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const accessibleDescription = title.overview ?? `${title.name}, a ${title.kind === "series" ? "series" : "film"}.`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children}
      {isDesktop ? (
        <DialogContent showCloseButton={false} className="top-[max(1rem,3vh)] max-h-[calc(100dvh-2*max(1rem,3vh))] w-[calc(100%-2rem)] max-w-[900px] translate-y-0 gap-0 overflow-y-auto overflow-x-hidden rounded-[12px] border-0 bg-ws-card p-0 text-white shadow-[0_24px_64px_rgba(0,0,0,0.8)] ring-0 sm:max-w-[900px]">
          <DialogTitle className="sr-only">{title.name}</DialogTitle>
          <DialogDescription className="sr-only">{accessibleDescription}</DialogDescription>
          <CloseButton />
          <TitleDetailsBody title={title} open={open} />
        </DialogContent>
      ) : (
        <SheetContent side="bottom" showCloseButton={false} className="max-h-[94dvh] overflow-y-auto overflow-x-hidden rounded-t-[12px] border-0 bg-ws-card p-0 text-white">
          <SheetTitle className="sr-only">{title.name}</SheetTitle>
          <SheetDescription className="sr-only">{accessibleDescription}</SheetDescription>
          <CloseButton />
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

function CloseButton() {
  return (
    <DialogClose render={<button type="button" aria-label="Close" className="absolute right-4 top-4 z-30 flex size-11 items-center justify-center rounded-full bg-ws-card text-white transition-colors hover:bg-ws-elevated focus-visible:outline-2 focus-visible:outline-white" />}>
      <X className="size-6" aria-hidden />
    </DialogClose>
  );
}

function TitleDetailsBody({ title, open }: { title: MediaTitle; open: boolean }) {
  const parsed = parseCompositeId(title.id);
  const { details, loading } = useTitleDetails(parsed?.mediaType ?? null, parsed?.tmdbId ?? null, open);
  const genreMap = useGenreMap();
  const reducedMotion = useReducedMotion();
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

  const trailerKey = useTrailerKey(parsed?.mediaType ?? null, parsed?.tmdbId ?? null, open && !reducedMotion);
  const [muted, setMuted] = useState(true);
  const durationLabel = merged.kind === "movie" ? (merged.runtimeMinutes ? formatRuntime(merged.runtimeMinutes) : null) : merged.seasons ? `${merged.seasons} Season${merged.seasons === 1 ? "" : "s"}` : null;

  return (
    <div>
      <div className="relative aspect-video w-full shrink-0 bg-black">
        {backdrop ? (
          <Image src={backdrop} alt="" fill priority sizes="900px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-ws-muted"><Clapperboard className="size-10" aria-hidden /></div>
        )}
        {open && trailerKey && !reducedMotion && <HoverPreview trailerKey={trailerKey} title={merged.name} muted={muted} />}
        <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-ws-card via-ws-card/20 via-35% to-transparent" />
        <div className="absolute inset-x-[5%] bottom-[8%] z-20 flex flex-col gap-4">
          {merged.logoUrl ? (
            <div className="relative h-14 w-3/4 max-w-sm sm:h-20"><Image src={merged.logoUrl} alt={merged.name} fill sizes="360px" className="object-contain object-left-bottom drop-shadow-lg" /></div>
          ) : (
            <h1 className="text-balance text-3xl font-black uppercase leading-none tracking-[-0.02em] text-white drop-shadow-lg sm:text-5xl">{merged.name}</h1>
          )}
          <div className="flex items-center justify-between gap-3">
            <TitleActionButtons title={merged} wide />
            {trailerKey && !reducedMotion && (
              <button type="button" aria-label={muted ? "Unmute preview" : "Mute preview"} aria-pressed={!muted} onClick={() => setMuted((m) => !m)} className="flex size-10 items-center justify-center rounded-full border-2 border-white/50 bg-ws-elevated/60 text-white transition-colors hover:border-white">
                {muted ? <VolumeX className="size-5" aria-hidden /> : <Volume2 className="size-5" aria-hidden />}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6 px-[5%] pb-10 pt-4 sm:px-8">
        <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:gap-10">
          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-base text-ws-text-2">
              {merged.year && <span>{merged.year}</span>}
              <span>{merged.kind === "series" ? "Series" : "Film"}</span>
              {durationLabel && <span>{durationLabel}</span>}
              {merged.certification && <span className="rounded-[3px] border border-white/40 px-1.5 text-xs leading-5 text-white">{merged.certification}</span>}
              {merged.match !== null && <span className="font-semibold text-[#46d369]">{merged.match}% Match</span>}
            </div>
            {loading && !overview ? (
              <Skeleton className="h-16 w-full bg-white/5" />
            ) : overview ? (
              <div>
                <p className={`text-base leading-7 text-white transition-all duration-300 ${showReadMore && !synopsisExpanded ? "line-clamp-4" : ""}`}>{overview}</p>
                {showReadMore && (
                  <button type="button" onClick={() => setSynopsisExpanded((value) => !value)} className="mt-1.5 text-sm font-semibold text-ws-text-2 underline-offset-2 hover:text-white hover:underline">{synopsisExpanded ? "Read Less" : "Read More"}</button>
                )}
              </div>
            ) : null}
          </div>
          <div className="min-w-0 space-y-3 text-sm leading-6">
            {merged.genres.length > 0 && <p><span className="text-ws-muted">Genres: </span>{merged.genres.join(", ")}</p>}
            {loading ? (
              <Skeleton className="h-10 w-2/3 bg-white/5" />
            ) : hasCrewInfo ? (
              <>
                {cast.length > 0 && (
                  <p>
                    <span className="text-ws-muted">Cast: </span>{visibleCast.map((member) => member.name).join(", ")}
                    {cast.length > 6 && <button type="button" onClick={() => setCastExpanded((value) => !value)} className="ml-2 font-semibold text-ws-text-2 hover:text-white">{castExpanded ? "Less" : "More"}</button>}
                  </p>
                )}
                {details?.mediaType === "movie" && director && <p><span className="text-ws-muted">Director: </span>{director}</p>}
                {details?.mediaType === "tv" && creators && <p><span className="text-ws-muted">Creators: </span>{creators}</p>}
              </>
            ) : null}
          </div>
        </div>

        {details?.mediaType === "tv" && parsed && details.seasons && details.seasons.length > 0 && (
          <EpisodesSection seriesId={parsed.tmdbId} seasons={details.seasons} progress={title.progress} title={merged} />
        )}

        {recommendations.length > 0 && (
          <div className="pt-2">
            <h2 className="mb-3 text-lg font-semibold text-white">More Like This</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {recommendations.map((item) => {
                const presented = toPresentationTitleClient(item, genreMap);
                return (
                  <Link key={`${item.mediaType}-${item.id}`} href={`/title/${item.mediaType}/${item.id}`} className="group/rec overflow-hidden rounded-[6px] bg-ws-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
                    <div className="relative aspect-video">
                      {presented.backdropUrl ? (
                        <Image src={presented.backdropUrl} alt="" fill sizes="240px" className="object-cover transition-transform duration-200 group-hover/rec:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-ws-muted"><Clapperboard className="size-5" aria-hidden /></div>
                      )}
                    </div>
                    <p className="truncate px-2 py-1.5 text-xs text-ws-text">{presented.name}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {!loading && !details && <p className="text-xs text-ws-text-2">Full details for this title are temporarily unavailable.</p>}
      </div>
    </div>
  );
}
