import type { MediaTitle } from "@/lib/types";
import { MediaCard } from "@/components/content/media-card";

export function ContinueWatchingCard({ title, onRemove }: { title: MediaTitle; onRemove?: (tmdbId: number, mediaType: "movie" | "tv") => void }) {
  return <MediaCard title={title} variant="continue-watching" onRemove={onRemove} />;
}
