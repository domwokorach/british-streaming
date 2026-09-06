import { ContentRow } from "@/components/content/content-row";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { toMediaItem } from "@/lib/tmdb";
import { toPresentationRows } from "@/lib/catalogue";
import { getOnTheAirSeries, getPopularSeries, getTopRatedSeries } from "@/lib/tmdb/tv";

export default async function SeriesPage() {
  const results = await Promise.allSettled([getPopularSeries(), getTopRatedSeries(), getOnTheAirSeries()]);
  const value = (index: number) => (results[index].status === "fulfilled" ? results[index].value.results.map((item) => toMediaItem(item, "tv")) : []);
  const rows = (await toPresentationRows([
    { title: "Trending Series", items: value(0), variant: "top-ten" as const },
    { title: "Top-Rated Series", items: value(1) },
    { title: "Currently Airing", items: value(2) },
  ])).filter((row) => row.items.length > 0);
  return (
    <main className="min-h-screen bg-[#141414] pb-12 text-white">
      <Navbar />
      <div className="pt-28">
        <h1 className="px-4 text-3xl font-bold sm:px-10">Series</h1>
        {rows.length > 0 ? rows.map((row) => <ContentRow key={row.title} row={row} />) : <p className="px-4 pt-6 text-zinc-400 sm:px-10">Series are temporarily unavailable.</p>}
      </div>
      <Footer />
    </main>
  );
}
