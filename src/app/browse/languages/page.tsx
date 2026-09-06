import { ContentRow } from "@/components/content/content-row";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { toMediaItem } from "@/lib/tmdb";
import { toPresentationRows } from "@/lib/catalogue";
import { discoverMovies, discoverTv } from "@/lib/tmdb/discover";

const LANGUAGES = [{ code: "en", label: "English" }, { code: "ko", label: "Korean" }, { code: "es", label: "Spanish" }];

export default async function LanguagesPage() {
  const results = await Promise.allSettled(LANGUAGES.flatMap((language) => [discoverMovies({ with_original_language: language.code }), discoverTv({ with_original_language: language.code })]));
  const rows = (await toPresentationRows(LANGUAGES.map((language, index) => {
    const movies = results[index * 2];
    const series = results[index * 2 + 1];
    const items = [
      ...(movies.status === "fulfilled" ? movies.value.results.map((item) => toMediaItem(item, "movie")) : []),
      ...(series.status === "fulfilled" ? series.value.results.map((item) => toMediaItem(item, "tv")) : []),
    ];
    return { title: `${language.label}-language Stories`, items };
  }))).filter((row) => row.items.length > 0);
  return (
    <main className="min-h-screen bg-[#141414] pb-12 text-white">
      <Navbar />
      <div className="pt-28">
        <h1 className="px-4 text-3xl font-bold sm:px-10">Browse by Languages</h1>
        {rows.length > 0 ? rows.map((row) => <ContentRow key={row.title} row={row} />) : <p className="px-4 pt-6 text-zinc-400 sm:px-10">No titles available right now.</p>}
      </div>
      <Footer />
    </main>
  );
}
