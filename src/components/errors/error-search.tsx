"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Search } from "lucide-react";

import type { MediaItem } from "@/lib/tmdb/types";

const MAX_RESULTS = 5;

/** Searches the real catalogue (`/api/search`, the same endpoint as the navbar) and only ever links to titles it returned. */
export function ErrorSearch() {
  const router = useRouter();
  const inputId = useId();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const trimmed = query.trim();

  useEffect(() => {
    if (!trimmed) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then((response) => (response.ok ? response.json() : Promise.reject(new Error("search failed"))))
        .then((data: unknown) => {
          if (controller.signal.aborted) return;
          setResults(Array.isArray(data) ? (data as MediaItem[]).slice(0, MAX_RESULTS) : []);
          setFailed(!Array.isArray(data));
        })
        .catch((error: unknown) => {
          if ((error as { name?: string })?.name !== "AbortError") { setResults([]); setFailed(true); }
        })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [trimmed]);

  const open = (item: MediaItem) => router.push(`/title/${item.mediaType}/${item.id}`);
  const showPanel = trimmed.length > 0 && !loading;
  const status = loading ? "Searching…" : failed ? "Search is temporarily unavailable." : results.length ? `${results.length} result${results.length === 1 ? "" : "s"} found.` : "No results found.";

  return (
    <div className="w-full max-w-md">
      <form
        role="search"
        aria-label="Search British Streaming"
        onSubmit={(event) => { event.preventDefault(); if (results[0]) open(results[0]); }}
        className="group relative"
      >
        <label htmlFor={inputId} className="sr-only">Search films and series</label>
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ws-text-2 transition-colors group-focus-within:text-ws-blue-light motion-reduce:transition-none" />
        <input
          id={inputId}
          type="search"
          autoComplete="off"
          enterKeyHint="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search films and series"
          aria-controls={listId}
          className="h-12 w-full rounded-xl border border-ws-border bg-ws-card/80 pr-11 pl-11 text-base text-white placeholder:text-ws-text-2 outline-none transition-[box-shadow,border-color] duration-200 focus-visible:border-ws-blue-light focus-visible:ring-2 focus-visible:ring-ws-blue-light/60 group-focus-within:shadow-[0_0_28px_-6px_var(--ws-blue)] motion-reduce:transition-none"
        />
        {loading && <LoaderCircle aria-hidden className="absolute top-1/2 right-4 size-5 -translate-y-1/2 animate-spin text-ws-text" />}
      </form>
      <p className="sr-only" role="status" aria-live="polite">{trimmed ? status : ""}</p>
      <div id={listId}>
        {showPanel && (failed || results.length === 0) && (
          <p className="mt-2 rounded-xl bg-ws-card/80 px-4 py-3 text-left text-sm text-ws-text-2">
            {failed ? "Search is temporarily unavailable." : `No results found for “${trimmed}”.`}
          </p>
        )}
        {showPanel && !failed && results.length > 0 && (
          <ul className="mt-2 divide-y divide-white/10 overflow-hidden rounded-xl border border-ws-border bg-ws-card/90 text-left">
            {results.map((item) => (
              <li key={`${item.mediaType}-${item.id}`}>
                <a
                  href={`/title/${item.mediaType}/${item.id}`}
                  onClick={(event) => { event.preventDefault(); open(item); }}
                  className="flex min-h-12 items-center justify-between gap-3 px-4 py-2 text-sm text-white outline-none hover:bg-ws-elevated focus-visible:bg-ws-elevated focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ws-blue-light"
                >
                  <span className="truncate font-medium">{item.title}</span>
                  <span className="shrink-0 text-xs text-ws-text-2">{item.mediaType === "tv" ? "Series" : "Film"}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
