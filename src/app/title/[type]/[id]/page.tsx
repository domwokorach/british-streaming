import Image from "next/image";
import { notFound } from "next/navigation";

import { ContentRow } from "@/components/content/content-row";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Badge } from "@/components/ui/badge";
import { PlayTrailerButton } from "@/components/title/play-trailer-button";
import { toMediaDetails, getRecommendationRows } from "@/lib/tmdb";
import { toFeaturedTitle, toPresentationRows, toPresentationTitle } from "@/lib/catalogue";
import { getGenreMap } from "@/lib/tmdb/genres";
import { getMovieDetails } from "@/lib/tmdb/movies";
import { getSeriesDetails } from "@/lib/tmdb/tv";

export default async function TitleDetailsPage({ params }: PageProps<"/title/[type]/[id]">) {
  const { type, id } = await params;
  if (type !== "movie" && type !== "tv") notFound();
  const numericId = Number(id);
  if (!Number.isSafeInteger(numericId)) notFound();

  const media = await (type === "tv" ? getSeriesDetails(numericId) : getMovieDetails(numericId)).catch(() => null);
  if (!media) notFound();

  const details = toMediaDetails(media, type);
  const genreMap = await getGenreMap();
  const title = toPresentationTitle(details, genreMap);
  const featured = await toFeaturedTitle(details);
  const recommendationRows = (await toPresentationRows(await getRecommendationRows(type, numericId))).filter((row) => row.items.length > 0);

  return (
    <main className="min-h-screen bg-[#141414] pb-16 text-white">
      <Navbar />
      <section className="relative h-[56vh] min-h-[380px] max-h-[620px]">
        <Image src={featured.backdropId} alt="" fill priority sizes="100vw" className="object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-transparent" />
      </section>

      <div className="relative z-10 -mt-24 flex flex-col gap-6 px-4 sm:-mt-32 sm:flex-row sm:px-10">
        <div className="relative mx-auto hidden h-72 w-48 shrink-0 overflow-hidden rounded-md shadow-2xl sm:block">
          {title.artworkId && <Image src={title.artworkId} alt={`${title.name} poster`} fill sizes="192px" className="object-cover" />}
        </div>

        <div className="flex-1">
          <h1 className="font-serif text-3xl font-semibold sm:text-5xl">{details.title}</h1>
          {details.originalTitle && details.originalTitle !== details.title && <p className="mt-1 text-sm text-zinc-400">Original title: {details.originalTitle}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium text-zinc-200">
            <p className="text-sm font-semibold text-[#46d369]">{title.match}% Match</p>
            <span>{title.year}</span>
            {details.certification && <Badge className="rounded-sm border border-zinc-500 bg-transparent px-1.5 text-zinc-200">{details.certification}</Badge>}
            {details.runtime && <span>{details.runtime} min</span>}
            {type === "tv" && details.numberOfSeasons && <span>{details.numberOfSeasons} Season{details.numberOfSeasons === 1 ? "" : "s"}</span>}
            {type === "tv" && details.numberOfEpisodes && <span>{details.numberOfEpisodes} Episodes</span>}
          </div>

          <p className="mt-2 text-xs text-zinc-400">{details.genres.map((genre) => genre.name).join(", ")}</p>
          {details.tagline && <p className="mt-3 text-sm italic text-zinc-400">{details.tagline}</p>}
          <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-200 sm:text-base">{details.overview || "No overview available."}</p>

          {details.trailerKey && <div className="mt-6"><PlayTrailerButton title={title} /></div>}

          {details.cast.length > 0 && (
            <p className="mt-6 text-sm text-zinc-300"><span className="text-zinc-500">Cast: </span>{details.cast.slice(0, 8).map((member) => member.name).join(", ")}</p>
          )}
          {type === "movie" && details.directors.length > 0 && (
            <p className="mt-1 text-sm text-zinc-300"><span className="text-zinc-500">Director: </span>{details.directors.map((member) => member.name).join(", ")}</p>
          )}
          {type === "tv" && details.creators.length > 0 && (
            <p className="mt-1 text-sm text-zinc-300"><span className="text-zinc-500">Creator: </span>{details.creators.map((creator) => creator.name).join(", ")}</p>
          )}

          {details.watchProviders && (details.watchProviders.flatrate.length > 0 || details.watchProviders.rent.length > 0 || details.watchProviders.buy.length > 0) && (
            <div className="mt-6 space-y-2 text-sm">
              {details.watchProviders.availableOnNetflix && <p className="font-semibold text-white">Available on Netflix in {details.watchProviders.region}</p>}
              {details.watchProviders.flatrate.length > 0 && <ProviderRow label="Stream" providers={details.watchProviders.flatrate} />}
              {details.watchProviders.rent.length > 0 && <ProviderRow label="Rent" providers={details.watchProviders.rent} />}
              {details.watchProviders.buy.length > 0 && <ProviderRow label="Buy" providers={details.watchProviders.buy} />}
              <p className="text-[11px] text-zinc-500">Availability data from TMDB &middot; JustWatch. This app does not stream Netflix content directly.</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10">
        {recommendationRows.map((row) => <ContentRow key={row.title} row={row} />)}
      </div>
      <Footer />
    </main>
  );
}

function ProviderRow({ label, providers }: { label: string; providers: { provider_id: number; provider_name: string; logo_path: string | null }[] }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 shrink-0 text-zinc-500">{label}</span>
      <div className="flex flex-wrap gap-2">
        {providers.map((provider) => (
          <span key={provider.provider_id} className="flex items-center gap-1.5 rounded-sm bg-white/5 px-2 py-1 text-xs text-zinc-200">
            {provider.logo_path && <Image src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`} alt="" width={16} height={16} className="rounded-sm" />}
            {provider.provider_name}
          </span>
        ))}
      </div>
    </div>
  );
}
