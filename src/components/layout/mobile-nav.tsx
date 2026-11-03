"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NAV_ITEMS } from "@/lib/constants";
import { NavLink } from "./nav-link";
import { cn } from "cn";

export function MobileNav() {
  const pathname = usePathname();
  return (
    <Sheet>
      <SheetTrigger render={<Button aria-label="Open navigation" variant="ghost" size="icon" className="text-white hover:bg-white/10 lg:hidden" />}><Menu /></SheetTrigger>
      <SheetContent side="left" className="w-72 border-white/10 bg-ws-bg p-0 text-white">
        <div className="border-b border-white/10 px-6 py-7"><span className="text-xl font-black tracking-tight bg-gradient-to-r from-ws-blue-light to-ws-lavender bg-clip-text text-transparent">British Streaming</span></div>
        <nav className="flex flex-col p-3">
          {NAV_ITEMS.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <NavLink
                className={cn("rounded-md px-4 py-3 text-sm transition-colors duration-150", active ? "bg-white/10 font-semibold text-white" : "text-ws-text hover:bg-white/10 hover:text-white")}
                href={item.href}
                key={item.href}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
