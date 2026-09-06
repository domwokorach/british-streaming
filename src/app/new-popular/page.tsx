import { ContentRow } from "@/components/content/content-row";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { toMediaItem } from "@/lib/tmdb";
import { toPresentationRows } from "@/lib/catalogue";
import { getNowPlayingMovies, getUpcomingMovies } from "@/lib/tmdb/movies";
import { getOnTheAirSeries } from "@/lib/tmdb/tv";
import { getTrending } from "@/lib/tmdb/trending";

export default async function NewPopularPage() {
  const results = await Promise.allSettled([getTrending("all"), getUpcomingMovies(), getNowPlayingMovies(), getOnTheAirSeries()]);
  const trending = results[0].status === "fulfilled" ? results[0].value.results.map((item) => toMediaItem(item, item.title ? "movie" : "tv")) : [];
  const value = (index: number, mediaType: "movie" | "tv") => (results[index].status === "fulfilled" ? results[index].value.results.map((item) => toMediaItem(item, mediaType)) : []);
  const rows = (await toPresentationRows([
    { title: "New & Popular Today", items: trending, variant: "top-ten" as const },
    { title: "Coming Soon", items: value(1, "movie") },
    { title: "Now Playing", items: value(2, "movie") },
    { title: "Currently Airing", items: value(3, "tv") },
  ])).filter((row) => row.items.length > 0);
  return (
    <main className="min-h-screen bg-[#141414] pb-12 text-white">
      <Navbar />
      <div className="pt-28">
        <h1 className="px-4 text-3xl font-bold sm:px-10">New &amp; Popular</h1>
        {rows.length > 0 ? rows.map((row) => <ContentRow key={row.title} row={row} />) : <p className="px-4 pt-6 text-zinc-400 sm:px-10">Nothing new to show right now.</p>}
      </div>
      <Footer />
    </main>
  );
}
