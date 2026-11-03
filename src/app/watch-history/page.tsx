"use client";

import { useEffect, useState } from "react";
import { ContentRow } from "@/components/content/content-row";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Skeleton } from "@/components/ui/skeleton";
import { useResolvedTitles } from "@/hooks/use-resolved-titles";
import { api } from "@/lib/auth/client";

export default function WatchHistoryPage() {
  const [entries, setEntries] = useState<Array<{ tmdbId: number; mediaType: "movie" | "tv" }> | null>(null);
  useEffect(() => {
    void api<{ entries: Array<{ tmdbId: number; mediaType: "movie" | "tv" }> }>("/api/me/history").then((res) => setEntries(res.ok ? res.data.entries : []));
  }, []);
  const { titles, loading } = useResolvedTitles(entries ?? []);
  const busy = entries === null || loading;
  return (
    <main className="min-h-dvh bg-ws-bg pb-12 text-white">
      <Navbar />
      <div className="pt-28">
        <h1 className="px-4 text-3xl font-bold sm:px-10">Watch history</h1>
        {busy && <div className="flex gap-3 px-4 pt-6 sm:px-10">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="aspect-video w-64 rounded bg-ws-elevated" />)}</div>}
        {!busy && titles.length === 0 && <p className="px-4 pt-6 text-ws-text-2 sm:px-10">Nothing here yet. Titles you watch will appear here.</p>}
        {!busy && titles.length > 0 && <ContentRow row={{ title: "Recently watched", items: titles }} />}
      </div>
      <Footer />
    </main>
  );
}
