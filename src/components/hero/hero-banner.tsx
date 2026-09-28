"use client";

import Image from "next/image";
import { CircleHelp, Play } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { TitleDetailsModal } from "@/components/title/title-details-modal";
import { MediaMetadata } from "@/components/content/media-metadata";
import type { FeaturedTitle } from "@/lib/types";
import { usePlayback } from "@/providers/playback-provider";

export function HeroBanner({ featured }: { featured: FeaturedTitle }) {
  const { title } = featured;
  const { playMedia } = usePlayback();
  return (
    <section className="relative h-[72vh] min-h-[520px] max-h-[760px] overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0"
      >
        {title.backdropUrl && <Image src={title.backdropUrl} alt="" fill priority sizes="100vw" className="object-cover object-[58%_center]" />}
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/35 to-transparent" /><div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-black/30" />
      <div className="absolute bottom-[12%] left-4 z-10 max-w-lg sm:left-10">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
          className="mb-3 flex items-center gap-2 text-xs font-bold tracking-[0.22em] text-zinc-200"
        >
          <span className="text-xl leading-none text-[#e50914]">N</span> {title.kind === "series" ? "SERIES" : "FILM"}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mb-4 font-serif text-5xl leading-[0.85] font-semibold tracking-[-0.07em] text-white drop-shadow-lg sm:text-7xl"
        >
          {title.name}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: "easeOut" }}
          className="mb-5 max-w-md text-sm leading-5 text-zinc-100 drop-shadow sm:text-base sm:leading-6"
        >
          {featured.description}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.48, ease: "easeOut" }}
          className="mb-6"
        >
          <MediaMetadata title={title} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.55, ease: "easeOut" }}
          className="flex gap-2"
        >
          <Button
            onClick={() => playMedia(title)}
            size="lg"
            className="h-11 rounded-md bg-white px-6 font-bold text-black transition-transform duration-150 hover:scale-[1.02] hover:bg-white/85 active:scale-[0.97]"
          >
            <Play className="size-5 fill-current" /> Play
          </Button>
          <TitleDetailsModal
            title={title}
            renderTrigger={
              <Button size="lg" className="h-11 rounded-md bg-zinc-500/70 px-5 font-bold text-white transition-transform duration-150 hover:scale-[1.02] hover:bg-zinc-500/55 active:scale-[0.97]" />
            }
          >
            <CircleHelp className="size-5" /> More Info
          </TitleDetailsModal>
        </motion.div>
      </div>
    </section>
  );
}
