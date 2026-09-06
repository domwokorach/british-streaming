"use client";

import Image from "next/image";
import type { ReactElement, ReactNode } from "react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { artworkUrl } from "@/lib/constants";
import type { MediaTitle } from "@/lib/types";
import { TitleActionButtons } from "./action-buttons";
import { TitleMetadata } from "./title-metadata";

interface TitleDetailsModalProps {
  title: MediaTitle;
  backdropId?: string;
  description?: string;
  renderTrigger: ReactElement;
  children: ReactNode;
}

/** Details for the same title, shown as a Dialog on desktop and a bottom Sheet on mobile. */
export function TitleDetailsModal({ title, backdropId, description, renderTrigger, children }: TitleDetailsModalProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const summary = description ?? `${title.genres.join(", ")}.`;
  const backdrop = (
    <div className="relative h-60 shrink-0">
      <Image src={artworkUrl(backdropId ?? title.artworkId, "w=1100&h=650")} alt="" fill sizes="600px" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#181818] to-transparent" />
    </div>
  );
  const body = (
    <div className="relative -mt-14 px-6 pb-6">
      <p className="text-sm font-semibold text-[#46d369]">{title.match}% Match</p>
      <div className="mt-2 mb-3"><TitleMetadata title={title} /></div>
      <p className="mb-4 leading-6 text-zinc-300">{summary}</p>
      <TitleActionButtons title={title} />
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog>
        <DialogTrigger render={renderTrigger}>{children}</DialogTrigger>
        <DialogContent className="max-w-xl overflow-hidden border-white/10 bg-[#181818] p-0 text-white sm:max-w-xl">
          {backdrop}
          <DialogHeader className="px-6"><DialogTitle className="font-serif text-3xl">{title.name}</DialogTitle><DialogDescription className="sr-only">{summary}</DialogDescription></DialogHeader>
          {body}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet>
      <SheetTrigger render={renderTrigger}>{children}</SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto border-white/10 bg-[#181818] p-0 text-white">
        {backdrop}
        <SheetHeader className="px-6"><SheetTitle className="font-serif text-2xl text-white">{title.name}</SheetTitle><SheetDescription className="sr-only">{summary}</SheetDescription></SheetHeader>
        {body}
      </SheetContent>
    </Sheet>
  );
}
