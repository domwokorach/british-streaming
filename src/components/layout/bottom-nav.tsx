"use client";

import { Bookmark, Clapperboard, Film, Flame, House, Languages } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FloatingDock, type DockItem } from "@/components/ui/floating-dock";
import { cn } from "cn";

const DESTINATIONS = [
  { title: "Home", href: "/", icon: <House /> },
  { title: "Series", href: "/series", icon: <Clapperboard /> },
  { title: "Films", href: "/films", icon: <Film /> },
  { title: "New & Popular", href: "/new-popular", icon: <Flame /> },
  { title: "My List", href: "/my-list", icon: <Bookmark /> },
  { title: "Browse by Language", href: "/browse/languages", icon: <Languages /> },
];

/** Past this scroll depth the desktop header may have slid away, so the dock steps in to keep navigation within reach. */
const DESKTOP_REVEAL_PX = 480;

/**
 * Floating dock navigation. Phones and tablets (below `lg`) get it permanently, replacing the old tab bar; on desktop,
 * where the sticky header already carries the same links, it only appears after scrolling so the two never compete.
 */
export function BottomNav() {
  const pathname = usePathname();
  const [deep, setDeep] = useState(false);
  useEffect(() => {
    const onScroll = () => setDeep(window.scrollY > DESKTOP_REVEAL_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  // Auth screens are full-bleed; the dock would sit over the form.
  if (/^\/account\/(sign-|register|forgot-password|reset-password|verify-email|session-refresh)/.test(pathname)) return null;
  const items: DockItem[] = DESTINATIONS.map((d) => ({ ...d, active: d.href === "/" ? pathname === "/" : pathname.startsWith(d.href) }));
  return (
    <div className={cn("pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-[opacity,transform] duration-300 motion-reduce:transition-none", deep ? "" : "lg:invisible lg:translate-y-6 lg:opacity-0")}>
      <FloatingDock items={items} label="Quick navigation" className="pointer-events-auto max-w-full" />
    </div>
  );
}
