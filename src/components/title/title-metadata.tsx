import { Badge } from "@/components/ui/badge";
import type { MediaTitle } from "@/lib/types";

export function TitleMetadata({ title, compact = false }: { title: MediaTitle; compact?: boolean }) {
  return (
    <div className={compact ? "flex items-center gap-2 text-[10px] text-zinc-300" : "flex items-center gap-2 text-xs font-medium text-zinc-100"}>
      <Badge className="rounded-sm border border-zinc-500 bg-transparent px-1 py-0 text-[9px] font-normal text-zinc-200">{title.rating}</Badge>
      {!compact && <span>{title.year}</span>}
      <span>{title.runtime}</span>
      {compact && <span>HD</span>}
    </div>
  );
}
