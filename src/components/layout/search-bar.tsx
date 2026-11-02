"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LoaderCircle, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandInput, CommandList } from "@/components/ui/command";
import { InputGroup, InputGroupAddon, InputGroupButton } from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import type { MediaItem } from "@/lib/tmdb/types";

const TMDB_POSTER_BASE = "https://image.tmdb.org/t/p/w154";

function maturityRating(voteAverage: number) {
  if (!voteAverage) return null;
  if (voteAverage >= 8) return "18";
  if (voteAverage >= 6) return "15";
  return "12";
}

/** Expandable search: an InputGroup that expands from an icon, with results in a Command list below it. */
export function SearchBar() {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errored, setErrored] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then((response) => response.json())
        .then((data) => {
          if (controller.signal.aborted) return;
          setResults(Array.isArray(data) ? data : []);
          setErrored(!Array.isArray(data));
        })
        .catch((error) => {
          if (error?.name !== "AbortError") setErrored(true);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function collapse() {
    setExpanded(false);
    setQuery("");
  }

  function goToTitle(item: MediaItem) {
    router.push(`/title/${item.mediaType}/${item.id}`);
    collapse();
  }

  useEffect(() => {
    if (!expanded) return;
    function onPointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) collapse();
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [expanded]);

  const movies = results.filter((item) => item.mediaType === "movie");
  const series = results.filter((item) => item.mediaType === "tv");
  const trimmedQuery = query.trim();
  const showResults = expanded && trimmedQuery.length > 0;
  const showEmpty = !loading && !errored && showResults && results.length === 0;

  return (
    <div ref={containerRef} className="relative" onKeyDown={(event) => event.key === "Escape" && collapse()}>
      <Command shouldFilter={false}>
        <InputGroup
          className={`h-10 rounded-md border-white/30 bg-black/70 text-white transition-[width,background-color] duration-200 focus-within:border-white ${expanded ? "w-44 px-1 sm:w-72" : "w-10 border-transparent bg-transparent"}`}
        >
          <InputGroupAddon>
            {expanded ? (
              <Search className="size-4 text-zinc-300" aria-hidden />
            ) : (
              <Button aria-label="Search" variant="ghost" size="icon-sm" className="text-white hover:bg-white/10" onClick={() => setExpanded(true)}>
                <Search className="size-5" />
              </Button>
            )}
          </InputGroupAddon>
          {expanded && (
            <CommandInput
              autoFocus
              value={query}
              onValueChange={setQuery}
              aria-label="Search WorldStreaming"
              placeholder="Titles, people, genres"
              className="text-sm text-white placeholder:text-zinc-400"
            />
          )}
          {expanded && (
            <InputGroupAddon align="inline-end">
              {loading ? (
                <LoaderCircle className="size-4 animate-spin text-zinc-300" aria-hidden />
              ) : trimmedQuery ? (
                <InputGroupButton aria-label="Clear search" size="icon-xs" className="text-zinc-300 hover:bg-white/10 hover:text-white" onClick={() => setQuery("")}>
                  <X className="size-4" />
                </InputGroupButton>
              ) : null}
              <InputGroupButton aria-label="Close search" size="icon-xs" className="text-zinc-300 hover:bg-white/10 hover:text-white" onClick={collapse}>
                <X className="size-4" />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>

        <AnimatePresence>
          {showResults && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute right-0 top-full z-50 mt-2 origin-top-right"
            >
              <CommandList
                className="max-h-[70vh] w-[calc(100vw-2rem)] rounded-md bg-[#0d1b3e] text-white shadow-2xl ring-1 ring-white/15 sm:w-96"
              >
                {loading ? (
                  <div className="space-y-2 p-1">
                    {Array.from({ length: 4 }, (_, index) => (
                      <Skeleton key={index} className="h-14 w-full rounded bg-zinc-800" />
                    ))}
                  </div>
                ) : showEmpty ? (
                  <CommandEmpty className="px-4 py-8 text-center text-sm text-zinc-400">No results found for &ldquo;{trimmedQuery}&rdquo;.</CommandEmpty>
                ) : errored ? (
                  <CommandEmpty className="px-4 py-8 text-center text-sm text-zinc-400">Search is temporarily unavailable.</CommandEmpty>
                ) : (
                  <>
                    {movies.length > 0 && (
                      <CommandGroup heading="Movies">
                        {movies.map((item) => (
                          <SearchResultItem key={`movie-${item.id}`} item={item} onNavigate={goToTitle} />
                        ))}
                      </CommandGroup>
                    )}
                    {series.length > 0 && (
                      <CommandGroup heading="Series">
                        {series.map((item) => (
                          <SearchResultItem key={`tv-${item.id}`} item={item} onNavigate={goToTitle} />
                        ))}
                      </CommandGroup>
                    )}
                  </>
                )}
              </CommandList>
            </motion.div>
          )}
        </AnimatePresence>
      </Command>
    </div>
  );
}

function SearchResultItem({ item, onNavigate }: { item: MediaItem; onNavigate: (item: MediaItem) => void }) {
  const year = item.releaseDate?.slice(0, 4);
  const rating = maturityRating(item.voteAverage);
  return (
    <CommandItem value={`${item.mediaType}-${item.id}-${item.title}`} onSelect={() => onNavigate(item)} className="cursor-pointer hover:bg-accent">
      <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded bg-zinc-800">
        {item.posterPath && <Image src={`${TMDB_POSTER_BASE}${item.posterPath}`} alt="" fill sizes="40px" className="object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{item.title}</p>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-400">
          {year && <span>{year}</span>}
          <span>{item.mediaType === "tv" ? "Series" : "Movie"}</span>
          {rating && <Badge className="rounded-sm border border-zinc-500 bg-transparent px-1 py-0 text-[10px] font-normal text-zinc-300">{rating}</Badge>}
        </div>
      </div>
    </CommandItem>
  );
}
