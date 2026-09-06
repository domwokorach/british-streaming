"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { parseCompositeId } from "@/lib/tmdb-id";
import type { MediaTitle } from "@/lib/types";

type PlaybackContextValue = { playMedia: (media: MediaTitle) => void };
const PlaybackContext = createContext<PlaybackContextValue | null>(null);

export function PlaybackProvider({ children }: { children: React.ReactNode }) {
  const [trailer, setTrailer] = useState<{ title: string; key: string } | null>(null);
  const playMedia = useCallback(async (media: MediaTitle) => {
    const parsed = parseCompositeId(media.id);
    const id = parsed?.tmdbId ?? null;
    const type = parsed?.mediaType ?? (media.kind === "series" ? "tv" : "movie");
    if (!id) {
      toast.error("Video unavailable", { description: "No trailer or playable video is currently available for this title." });
      return;
    }
    try {
      const response = await fetch(`/api/title/${type}/${id}/videos`);
      if (!response.ok) throw new Error("Video lookup failed");
      const { trailerKey } = await response.json() as { trailerKey: string | null };
      if (!trailerKey) {
        toast.error("Video unavailable", { description: "No trailer or playable video is currently available for this title." });
        return;
      }
      setTrailer({ title: media.name, key: trailerKey });
    } catch {
      toast.error("Video unavailable", { description: "No trailer or playable video is currently available for this title." });
    }
  }, []);
  return <PlaybackContext.Provider value={{ playMedia }}>{children}<Dialog open={Boolean(trailer)} onOpenChange={(open) => !open && setTrailer(null)}><DialogContent className="max-w-4xl border-white/10 bg-black p-0 text-white"><DialogTitle className="sr-only">{trailer?.title} trailer</DialogTitle>{trailer && <iframe className="aspect-video w-full" src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`} title={`${trailer.title} trailer`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />}</DialogContent></Dialog></PlaybackContext.Provider>;
}

export function usePlayback() {
  const context = useContext(PlaybackContext);
  if (!context) throw new Error("usePlayback must be used within PlaybackProvider.");
  return context;
}
