import { InfiniteMediaGallery } from "@/components/content/infinite-media-gallery";
import type { ContentRowData } from "@/lib/types";

/** The catalogue builds these rows from TMDB's regional popularity ordering; we only present them, never re-rank. */
export function PopularGBFilms({ row }: { row: ContentRowData }) {
  return <InfiniteMediaGallery id="popular-gb-films" title="Popular Films in GB" titles={row.items} direction="left" />;
}

export function PopularGBSeries({ row }: { row: ContentRowData }) {
  return <InfiniteMediaGallery id="popular-gb-series" title="Popular Series in GB" titles={row.items} direction="right" />;
}

export const isPopularFilmsRow = (row: ContentRowData) => /^Popular Films in the /.test(row.title);
export const isPopularSeriesRow = (row: ContentRowData) => /^Popular Series in the /.test(row.title);
