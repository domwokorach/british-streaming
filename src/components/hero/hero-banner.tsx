"use client";

import Image from "next/image";
import { CircleHelp, Play, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TitleDetailsModal } from "@/components/title/title-details-modal";
import { artworkUrl } from "@/lib/constants";
import type { FeaturedTitle } from "@/lib/types";
import { usePlayback } from "@/providers/playback-provider";

export function HeroBanner({ featured }: { featured: FeaturedTitle }) {
  const { title } = featured;
  const { playMedia } = usePlayback();
  return (
    <section className="relative h-[72vh] min-h-[520px] max-h-[760px]">
      <Image src={artworkUrl(featured.backdropId, "w=2200&h=1250")} alt="" fill priority sizes="100vw" className="object-cover object-[58%_center]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/35 to-transparent" /><div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-black/30" />
      <div className="absolute bottom-[12%] left-4 z-10 max-w-lg sm:left-10">
        <p className="mb-3 flex items-center gap-2 text-xs font-bold tracking-[0.22em] text-zinc-200"><span className="text-xl leading-none text-[#e50914]">N</span> SERIES</p>
        <h1 className="mb-4 font-serif text-5xl leading-[0.85] font-semibold tracking-[-0.07em] text-white drop-shadow-lg sm:text-7xl">{title.name}</h1>
        <p className="mb-5 max-w-md text-sm leading-5 text-zinc-100 drop-shadow sm:text-base sm:leading-6">{featured.description}</p>
        <div className="mb-6 flex items-center gap-2 text-xs font-medium text-zinc-100"><Badge className="rounded-sm bg-zinc-600 px-1.5 text-white">{title.rating}</Badge><span>{title.year}</span><span>1 Season</span><span>HD</span></div>
        <div className="flex gap-2"><Button onClick={() => playMedia(title)} size="lg" className="h-11 rounded-md bg-white px-6 font-bold text-black hover:bg-white/80"><Play className="size-5 fill-current" /> Play</Button><TitleDetailsModal title={title} backdropId={featured.backdropId} description={featured.description} renderTrigger={<Button size="lg" className="h-11 rounded-md bg-zinc-500/70 px-5 font-bold text-white hover:bg-zinc-500/55" />}><CircleHelp className="size-5" /> More Info</TitleDetailsModal></div>
      </div>
      <div className="absolute bottom-[18%] right-0 z-10 flex items-center gap-3"><Button aria-label="Unmute preview" variant="outline" size="icon" className="size-10 rounded-full border-white/45 bg-black/25 text-white hover:bg-white hover:text-black"><Volume2 className="size-5" /></Button><span className="border-l-2 border-white/50 bg-zinc-800/50 py-2 pl-3 pr-10 text-xs">{title.rating}</span></div>
    </section>
  );
}
