"use client";

import { InfiniteMovingCards, MarqueeLinkCard, type MarqueeItem } from "@/components/ui/infinite-moving-cards";

/** Client wrapper so the server-rendered showcase can pass plain data (functions can't cross the boundary). */
export function PicksStrip({ items, label }: { items: MarqueeItem[]; label: string }) {
  return <InfiniteMovingCards items={items} getKey={(item) => item.href} renderItem={(item, { duplicate }) => <MarqueeLinkCard item={item} duplicate={duplicate} />} label={label} speed="slow" />;
}
