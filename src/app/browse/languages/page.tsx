import { ContentRow } from "@/components/content/content-row";
import { HoverEffect } from "@/components/ui/card-hover-effect";
import { NAV_SCROLL_MARGIN_CLASS } from "@/lib/nav-targets";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { toMediaItem } from "@/lib/tmdb";
import { toPresentationRows } from "@/lib/catalogue";
import { discoverMovies, discoverTv } from "@/lib/tmdb/discover";

const slug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
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
    <main className="min-h-screen bg-ws-bg pb-12 text-white">
      <Navbar />
      <div className="pt-28">
        <div id="languages-content" className={NAV_SCROLL_MARGIN_CLASS}>
        <h1 className="px-4 text-3xl font-bold sm:px-10">Browse by Languages</h1>
        
        {rows.length > 0 && <div className="px-4 pt-4 sm:px-10"><HoverEffect label="Languages" items={rows.map((row) => ({ title: row.title.replace(/ Stories$/, ""), description: `${row.items.length} films and series to explore`, link: `#${slug(row.title)}` }))} className="-mx-2" /></div>}
        {rows.length > 0 ? rows.map((row) => <div key={row.title} id={slug(row.title)} className="scroll-mt-28"><ContentRow row={row} /></div>) : <p className="px-4 pt-6 text-ws-text-2 sm:px-10">No titles available right now.</p>}
        </div>
      </div>
      <Footer />
    </main>
  );
}
