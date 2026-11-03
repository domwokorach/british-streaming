import Link from "next/link";

import { HeroParallax, type ParallaxProduct } from "@/components/ui/hero-parallax";
import { PicksStrip } from "@/components/content/picks-strip";
import type { MarqueeItem } from "@/components/ui/infinite-moving-cards";
import { parseCompositeId } from "@/lib/tmdb-id";
import type { ContentRowData, MediaTitle } from "@/lib/types";

const linkFor = (title: MediaTitle) => {
  const parsed = parseCompositeId(title.id);
  return parsed ? `/title/${parsed.mediaType}/${parsed.tmdbId}` : null;
};

const cta = "inline-flex min-h-11 items-center rounded-md px-4 py-[5px] text-sm font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/**
 * A feature band + curated strip built only from titles already loaded for the page's rows (no invented media).
 * Each title is used once across the two, so the strip never repeats the parallax artwork.
 */
export function FeaturedShowcase({ rows }: { rows: ContentRowData[] }) {
  const seen = new Set<string>();
  const unique = rows.flatMap((row) => row.items).filter((title) => {
    if (seen.has(title.id) || !linkFor(title) || !(title.backdropUrl ?? title.posterUrl)) return false;
    seen.add(title.id);
    return true;
  });
  const products: ParallaxProduct[] = unique.slice(0, 10).map((t) => ({ title: t.name, link: linkFor(t)!, thumbnail: (t.backdropUrl ?? t.posterUrl)! }));
  const picks: MarqueeItem[] = unique.slice(10, 24).map((t) => ({ title: t.name, caption: [t.year, t.genres[0]].filter(Boolean).join(" · ") || undefined, href: linkFor(t)!, image: t.backdropUrl ?? t.posterUrl }));
  if (products.length < 4) return null;
  return (
    <div className="mt-12 sm:mt-16">
      <HeroParallax products={products} heading="Featured on British Streaming" description="Hand-picked films and series from the catalogue, updated as it changes.">
        <Link href="/films" className={`${cta} bg-ws-blue hover:bg-ws-blue-bright`}>Browse films</Link>
        <Link href="/series" className={`${cta} bg-ws-purple hover:bg-ws-purple-electric`}>Browse series</Link>
      </HeroParallax>
      {picks.length >= 4 && (
        <section aria-labelledby="picks-h" className="mt-4 px-4 sm:px-[58px]">
          <h2 id="picks-h" className="mb-2 text-lg font-medium text-white sm:text-[22px]">Editor&apos;s picks</h2>
          <PicksStrip items={picks} label="Editor's picks" />
        </section>
      )}
    </div>
  );
}
