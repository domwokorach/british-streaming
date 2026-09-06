"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NAV_ITEMS } from "@/lib/constants";

export function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger render={<Button aria-label="Open navigation" variant="ghost" size="icon" className="text-white hover:bg-white/10 md:hidden" />}><Menu /></SheetTrigger>
      <SheetContent side="left" className="w-72 border-white/10 bg-[#141414] p-0 text-white">
        <div className="border-b border-white/10 px-6 py-7"><span className="text-2xl font-black tracking-[-0.12em] text-[#e50914]">NETFLIX</span></div>
        <nav className="flex flex-col p-3">{NAV_ITEMS.map((item) => <Link className="rounded-md px-4 py-3 text-sm text-zinc-300 hover:bg-white/10 hover:text-white" href={item.href} key={item.href}>{item.label}</Link>)}</nav>
      </SheetContent>
    </Sheet>
  );
}
