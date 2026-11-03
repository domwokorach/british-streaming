/** Formats real genre names as "Crime • Drama • Thriller" — never raw TMDB ids, never invented. */
export function MediaGenres({ genres, className = "text-[11px] text-ws-text-2" }: { genres: string[]; className?: string }) {
  if (genres.length === 0) return null;
  return <p className={className}>{genres.slice(0, 3).join(" • ")}</p>;
}
