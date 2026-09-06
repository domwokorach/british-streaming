"use client";

import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MediaTitle } from "@/lib/types";
import { usePlayback } from "@/providers/playback-provider";

export function PlayTrailerButton({ title }: { title: MediaTitle }) {
  const { playMedia } = usePlayback();
  return (
    <Button size="lg" className="h-11 rounded-md bg-white px-6 font-bold text-black hover:bg-white/80" onClick={() => playMedia(title)}>
      <Play className="size-5 fill-current" /> Play Trailer
    </Button>
  );
}
