import Image from "next/image";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { artworkUrl } from "@/lib/constants";
import type { MediaTitle } from "@/lib/types";
import { TitleActionButtons, circleButtonClass } from "@/components/title/action-buttons";
import { TitleDetailsModal } from "@/components/title/title-details-modal";
import { TitleMetadata } from "@/components/title/title-metadata";

export function MediaCard({ title }: { title: MediaTitle }) {
  return (
    <Card className="group/card relative overflow-visible rounded-md bg-transparent p-0 shadow-none ring-0">
      <div className="relative transition-all duration-300 ease-out group-hover/card:z-20 group-hover/card:scale-110">
        <div className="relative z-10 aspect-video overflow-hidden rounded-[3px] bg-zinc-800 shadow-lg">
          <Image src={artworkUrl(title.artworkId)} alt={`${title.name} artwork`} fill sizes="(max-width: 640px) 64vw, (max-width: 1024px) 33vw, 19vw" className="object-cover transition-transform duration-500 group-hover/card:scale-105" />
        </div>
        <div className="pointer-events-none absolute left-0 right-0 top-[96%] z-20 origin-top rounded-b-md bg-[#191919] px-3 pb-3 pt-3 opacity-0 shadow-2xl transition-all duration-200 group-hover/card:pointer-events-auto group-hover/card:top-full group-hover/card:opacity-100">
          <TitleActionButtons
            title={title}
            moreInfo={
              <TitleDetailsModal title={title} renderTrigger={<Button aria-label={`More information about ${title.name}`} size="icon" variant="outline" className={circleButtonClass} />}>
                <ChevronDown className="size-4" />
              </TitleDetailsModal>
            }
          />
          <p className="mb-1 mt-3 text-[11px] font-semibold text-[#46d369]">{title.match}% Match</p>
          <TitleMetadata title={title} compact />
          <p className="mt-2 text-[10px] text-zinc-300">{title.genres.join(", ")}</p>
        </div>
      </div>
    </Card>
  );
}
