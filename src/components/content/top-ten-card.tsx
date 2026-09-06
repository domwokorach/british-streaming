import type { MediaTitle } from "@/lib/types";
import { MediaCard } from "@/components/content/media-card";

export function TopTenCard({ title, rank }: { title: MediaTitle; rank: number }) {
  return (
    <div className="ml-11">
      <span className="pointer-events-none absolute -ml-12 mt-[-13px] z-0 font-serif text-[9.25rem] leading-none tracking-[-0.18em] text-[#171717] [-webkit-text-stroke:2px_#555] sm:text-[10.5rem]">{rank}</span>
      <MediaCard title={title} />
    </div>
  );
}
