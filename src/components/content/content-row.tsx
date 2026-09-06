"use client";

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import type { ContentRowData } from "@/lib/types";
import { ContinueWatchingCard } from "./continue-watching-card";
import { MediaCard } from "./media-card";
import { TopTenCard } from "./top-ten-card";

export function ContentRow({ row }: { row: ContentRowData }) {
  const isTopTen = row.variant === "top-ten";
  return (
    <section className="group/rail relative mt-8 first:mt-0 sm:mt-10">
      <h2 className="mb-3 px-4 text-[17px] font-semibold tracking-tight text-zinc-100 sm:px-10 sm:text-xl">{row.title}</h2>
      <Carousel opts={{ align: "start", dragFree: true }} className="px-4 sm:px-10">
        <CarouselContent className="-ml-2 sm:-ml-3">
          {row.items.map((title, index) => (
            <CarouselItem key={`${row.title}-${title.id}`} className={`pl-2 sm:pl-3 ${isTopTen ? "basis-[65%] sm:basis-[31%] lg:basis-[23%]" : "basis-[68%] sm:basis-[32%] lg:basis-[20%]"}`}>
              {isTopTen ? <TopTenCard title={title} rank={index + 1} /> : row.variant === "continue-watching" ? <ContinueWatchingCard title={title} /> : <MediaCard title={title} />}
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2 z-30 hidden h-20 w-8 rounded-sm border-0 bg-black/45 text-white hover:bg-black/75 disabled:hidden sm:flex" />
        <CarouselNext className="right-2 z-30 hidden h-20 w-8 rounded-sm border-0 bg-black/45 text-white hover:bg-black/75 disabled:hidden sm:flex" />
      </Carousel>
    </section>
  );
}
