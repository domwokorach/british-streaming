"use client";

import { ContentRow } from "@/components/content/content-row";
import { useResolvedTitles } from "@/hooks/use-resolved-titles";
import { useWatchProgress } from "@/hooks/use-watch-progress";
import { useAuth } from "@/providers/auth-provider";

/** Renders nothing until there's real, persisted playback progress for the signed-in user. */
export function ContinueWatchingRow() {
  const { user } = useAuth();
  const { entries } = useWatchProgress();
  const { titles } = useResolvedTitles(entries.map((entry) => ({ tmdbId: entry.tmdbId, mediaType: entry.mediaType, percent: entry.percent })));

  if (!user || titles.length === 0) return null;
  return <ContentRow row={{ title: "Continue Watching for You", items: titles, variant: "continue-watching" }} />;
}
