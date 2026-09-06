import { ContentRow } from "@/components/content/content-row";
import { ContinueWatchingRow } from "@/components/content/continue-watching-row";
import { HeroBanner } from "@/components/hero/hero-banner";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { toFeaturedTitle, toPresentationRows } from "@/lib/catalogue";
import { getHomepageCatalogue } from "@/lib/tmdb";

export default async function Home() {
  const catalogue = await getHomepageCatalogue().catch(() => ({ featured: null, rows: [] }));
  const rows = (await toPresentationRows(catalogue.rows)).filter((row) => row.items.length > 0);
  const featured = catalogue.featured ? await toFeaturedTitle(catalogue.featured) : null;
  return <main className="min-h-screen overflow-x-hidden bg-[#141414] text-white"><Navbar />{featured && <HeroBanner featured={featured} />}{rows.length > 0 ? <div className={`relative z-20 pb-16 ${featured ? "-mt-16 sm:-mt-20" : "pt-28"}`}><ContinueWatchingRow />{rows.map((row) => <ContentRow key={row.title} row={row} />)}</div> : <div className="flex min-h-[55vh] items-center justify-center px-6 pt-20 text-center text-zinc-400">Catalogue titles are temporarily unavailable. Add your TMDB read token to <code className="mx-1 text-zinc-200">.env.local</code> to load the catalogue.</div>}<Footer /></main>;
}
