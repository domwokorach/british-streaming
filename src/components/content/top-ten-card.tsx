import type { MediaTitle } from "@/lib/types";
import { MediaCard } from "@/components/content/media-card";

/**
 * Oversized outlined rank numeral sitting behind a portrait poster. The container is a size container, so the numeral
 * scales with the card height (cqh) at every viewport width instead of relying on fixed pixel sizes.
 */
export function TopTenCard({ title, rank }: { title: MediaTitle; rank: number }) {
  return (
    <div className="relative aspect-[262/182] w-full [container-type:size]">
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-[-4cqh] left-0 z-0 select-none text-[88cqh] font-black leading-[0.85] tracking-[-0.1em] text-ws-bg [-webkit-text-stroke:3px_var(--ws-purple-deep)]"
      >
        {rank}
      </span>
      <span className="sr-only">Number {rank}</span>
      <div className="absolute inset-y-0 right-0 z-10 aspect-[2/3]">
        <MediaCard title={title} thumb="portrait" className="h-full" />
        <span aria-hidden className="pointer-events-none absolute left-0 top-0 z-20 flex flex-col items-center rounded-tl-[6px] bg-ws-purple px-[3px] pb-[2px] pt-[1px] text-[7px] font-black leading-none text-white"><span>TOP</span><span className="text-[11px]">10</span></span>
      </div>
    </div>
  );
}
