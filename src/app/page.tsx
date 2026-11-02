import { ContentRow } from "@/components/content/content-row";
import { ContinueWatchingRow } from "@/components/content/continue-watching-row";
import { HeroBanner } from "@/components/hero/hero-banner";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { toFeaturedTitle, toPresentationRows } from "@/lib/catalogue";
import { getHomepageCatalogue } from "@/lib/tmdb";

export default async function Home() {
  const catalogue = await getHomepageCatalogue().catch(() => ({ featured: [], rows: [] }));
  const rows = (await toPresentationRows(catalogue.rows)).filter((row) => row.items.length > 0);
  const featured = await Promise.all(catalogue.featured.map(toFeaturedTitle));
  return <main className="min-h-screen overflow-x-hidden bg-[#0d1b3e] text-white"><Navbar />{featured.length > 0 && <HeroBanner slides={featured} />}{rows.length > 0 ? <div className={`relative z-20 pb-16 ${featured.length > 0 ? "pt-8" : "pt-28"}`}><ContinueWatchingRow />{rows.map((row, index) => <ContentRow key={row.title} row={row} {...(index === 0 ? { autoplayMs: 7000, loop: true } : {})} />)}</div> : <div className="flex min-h-[55vh] items-center justify-center px-6 pt-20 text-center text-zinc-400">Catalogue titles are temporarily unavailable. Add your TMDB read token to <code className="mx-1 text-zinc-200">.env.local</code> to load the catalogue.</div>}<Footer /></main>;
}
