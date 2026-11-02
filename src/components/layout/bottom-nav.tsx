"use client";

import { Bookmark, Clapperboard, Flame, House, Tv } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV_ITEMS } from "@/lib/constants";
import { cn } from "cn";

const ICONS = { home: House, tv: Tv, film: Clapperboard, flame: Flame, bookmark: Bookmark } as const;

/** Thumb-reach tab bar for phones; hidden from `md` up where the top nav takes over. */
export function BottomNav() {
  const pathname = usePathname();
  // The auth screens are full-bleed and don't need app navigation.
  if (/^\/account\/(sign-|register|forgot-password|reset-password|verify-email|session-refresh)/.test(pathname)) return null;
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0d1b3e]/90 pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] backdrop-blur-xl md:hidden">
      <ul className="flex h-14 items-stretch">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon];
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link href={item.href} aria-current={active ? "page" : undefined} className={cn("flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors active:scale-95", active ? "text-[#a78bfa]" : "text-zinc-400 hover:text-white")}>
                <Icon className="size-5" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
