import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import type { MediaTitle } from "@/lib/types";

export function formatRuntime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours > 0 ? `${hours}h ${String(rest).padStart(2, "0")}m` : `${rest}m`;
}

/**
 * Real metadata only: match %, certification, runtime/seasons, and year are each hidden individually
 * when TMDB hasn't supplied them (row cards only carry match/year; full details add the rest).
 */
export function MediaMetadata({ title, compact = false }: { title: MediaTitle; compact?: boolean }) {
  const durationLabel = title.kind === "movie" ? (title.runtimeMinutes ? formatRuntime(title.runtimeMinutes) : null) : title.seasons ? `${title.seasons} Season${title.seasons === 1 ? "" : "s"}` : null;

  if (compact) {
    const parts: ReactNode[] = [];
    if (title.match !== null) parts.push(<span key="match" className="font-semibold text-[#46d369]">{title.match}% Match</span>);
    if (title.certification) parts.push(<span key="cert">{title.certification}</span>);
    if (durationLabel) parts.push(<span key="dur">{durationLabel}</span>);
    if (parts.length === 0) return null;
    return (
      <p className="flex flex-wrap items-center gap-1.5 text-xs text-ws-text">
        {parts.map((part, index) => (
          <span key={index} className="flex items-center gap-1.5">
            {index > 0 && <span aria-hidden className="text-ws-text-2">•</span>}
            {part}
          </span>
        ))}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-ws-text">
      {title.match !== null && <span className="font-semibold text-[#46d369]">{title.match}% Match</span>}
      {title.year && <span>{title.year}</span>}
      {title.certification && <Badge className="rounded-sm border border-ws-border bg-transparent px-1 py-0 text-[9px] font-normal text-ws-text">{title.certification}</Badge>}
      {durationLabel && <span>{durationLabel}</span>}
    </div>
  );
}
