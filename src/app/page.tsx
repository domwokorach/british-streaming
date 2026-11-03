import { ContentRow } from "@/components/content/content-row";
import { FeaturedShowcase } from "@/components/content/featured-showcase";
import { isPopularFilmsRow, isPopularSeriesRow, PopularGBFilms, PopularGBSeries } from "@/components/content/popular-gb";
import { ContinueWatchingRow } from "@/components/content/continue-watching-row";
import { HeroBanner } from "@/components/hero/hero-banner";
import { NAV_SCROLL_MARGIN_CLASS } from "@/lib/nav-targets";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { toFeaturedTitle, toPresentationRows } from "@/lib/catalogue";
import { getHomepageCatalogue } from "@/lib/tmdb";

export default async function Home() {
  const catalogue = await getHomepageCatalogue().catch(() => ({ featured: [], rows: [] }));
  const rows = (await toPresentationRows(catalogue.rows)).filter((row) => row.items.length > 0);
  const featured = await Promise.all(catalogue.featured.map(toFeaturedTitle));
  return <main className="min-h-screen overflow-x-hidden bg-ws-bg text-white"><Navbar />{featured.length > 0 && <HeroBanner slides={featured} />}{rows.length > 0 ? <div id="home-content" className={`relative z-20 pb-16 ${NAV_SCROLL_MARGIN_CLASS} ${featured.length > 0 ? "pt-4" : "pt-28"}`}><ContinueWatchingRow />{rows.map((row) => isPopularFilmsRow(row) ? <PopularGBFilms key={row.title} row={row} /> : isPopularSeriesRow(row) ? <PopularGBSeries key={row.title} row={row} /> : <ContentRow key={row.title} row={row} />)}<FeaturedShowcase rows={rows} /></div> : <div className="flex min-h-[55vh] items-center justify-center px-6 pt-20 text-center text-ws-text-2">Catalogue titles are temporarily unavailable. Add your TMDB read token to <code className="mx-1 text-ws-text">.env.local</code> to load the catalogue.</div>}<Footer /></main>;
}
