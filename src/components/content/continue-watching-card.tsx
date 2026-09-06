import { Progress } from "@/components/ui/progress";
import type { MediaTitle } from "@/lib/types";
import { MediaCard } from "@/components/content/media-card";

export function ContinueWatchingCard({ title }: { title: MediaTitle }) {
  return (
    <div className="relative">
      <MediaCard title={title} />
      <div className="pointer-events-none absolute inset-x-3 top-[calc(100%-1.4rem)] z-10"><Progress value={title.progress?.percent ?? null} className="h-1 bg-white/40 [&>[data-slot=progress-track]>[data-slot=progress-indicator]]:bg-red-600" /></div>
    </div>
  );
}
