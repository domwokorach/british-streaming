import { ContentRow } from "@/components/content/content-row";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { toMediaItem } from "@/lib/tmdb";
import { toPresentationRows } from "@/lib/catalogue";
import { getNowPlayingMovies, getPopularMovies, getTopRatedMovies, getUpcomingMovies } from "@/lib/tmdb/movies";

export default async function FilmsPage() {
  const results = await Promise.allSettled([getPopularMovies(), getTopRatedMovies(), getNowPlayingMovies(), getUpcomingMovies()]);
  const value = (index: number) => (results[index].status === "fulfilled" ? results[index].value.results.map((item) => toMediaItem(item, "movie")) : []);
  const rows = (await toPresentationRows([
    { title: "Popular Films", items: value(0), variant: "top-ten" as const },
    { title: "Top-Rated Films", items: value(1) },
    { title: "Now Playing", items: value(2) },
    { title: "Coming Soon", items: value(3) },
  ])).filter((row) => row.items.length > 0);
  return (
    <main className="min-h-screen bg-ws-bg pb-12 text-white">
      <Navbar />
      <div className="pt-28">
        <h1 className="px-4 text-3xl font-bold sm:px-10">Films</h1>
        {rows.length > 0 ? rows.map((row) => <ContentRow key={row.title} row={row} />) : <p className="px-4 pt-6 text-ws-text-2 sm:px-10">Films are temporarily unavailable.</p>}
      </div>
      <Footer />
    </main>
  );
}
