"use client";

import { Bell, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { useState } from "react";
import { useHeaderHidden } from "@/hooks/use-scroll-direction";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CATEGORY_ITEMS, NAV_ITEMS } from "@/lib/constants";
import { cn } from "cn";
import { useAuth } from "@/providers/auth-provider";
import { MobileNav } from "./mobile-nav";
import { SearchBar } from "./search-bar";

export function Navbar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [keyboardFocus, setKeyboardFocus] = useState(false);
  const { hidden, scrolled } = useHeaderHidden(keyboardFocus);
  const displayName = user?.fullName ?? "Guest";

  const inCategories = CATEGORY_ITEMS.some((item) => pathname.startsWith(item.href));
  const mainItems = [
    ...NAV_ITEMS.filter((item) => item.href === "/" || item.href === "/my-list"),
    { label: "Categories", href: "/films" },
  ].sort((a, b) => ["/", "/films", "/my-list"].indexOf(a.href) - ["/", "/films", "/my-list"].indexOf(b.href));

  return (
    <header
      // Keyboard users must never lose the header, so it stays put while focus-visible is inside it.
      onFocusCapture={(e) => setKeyboardFocus(e.target instanceof HTMLElement && e.target.matches(":focus-visible"))}
      onBlurCapture={() => setKeyboardFocus(false)}
      className={cn(
        "fixed inset-x-0 top-0 z-40 h-[calc(62px+env(safe-area-inset-top))] border-b-2 px-[max(1rem,env(safe-area-inset-left))] pt-[env(safe-area-inset-top)] transition-[transform,background-color,border-color,box-shadow] duration-300 ease-out motion-reduce:transition-none sm:px-8",
        scrolled ? "border-[#7c3aed] bg-[#0d1b3e] shadow-[0_4px_20px_rgba(0,0,0,0.45)]" : "border-transparent bg-gradient-to-b from-[#0d1b3e] to-[#0d1b3e]/0",
        hidden && (inCategories ? "-translate-y-[calc(100%+2.75rem)]" : "-translate-y-full")
      )}
    >
      <div className="mx-auto flex h-full max-w-[1920px] items-center gap-2 sm:gap-6">
        <MobileNav />
        <Link href="/" aria-label="WorldStreaming home" className="shrink-0 text-lg font-extrabold tracking-wide text-[#a78bfa] sm:text-xl">WORLD<span className="text-white max-[379px]:hidden">STREAMING</span></Link>
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-9 text-[15px] font-medium uppercase tracking-[0.12em] md:flex">
          {mainItems.map((item) => {
            const active = item.label === "Categories" ? inCategories : item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link key={item.label} href={item.href} aria-current={active ? "page" : undefined} className={cn("relative py-5 transition-colors duration-150 hover:text-[#a78bfa]", active ? "text-[#a78bfa]" : "text-zinc-300")}>
                {item.label}
                {active && <ActiveBar className="bottom-0" />}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-1 sm:gap-3">
          <SearchBar />
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="Notifications" className="hidden text-white hover:bg-white/10 sm:flex" />}>
              <Bell className="size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="mt-3 w-64 rounded-md border-white/20 bg-black/90 p-3 text-white">
              <p className="text-sm font-medium text-zinc-200">Notifications</p>
              <p className="mt-1 text-xs text-zinc-400">No new notifications right now.</p>
            </DropdownMenuContent>
          </DropdownMenu>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" className="h-auto gap-1 p-0 text-white hover:bg-transparent" />}>
                <Avatar className="size-8 rounded-full"><AvatarFallback className="rounded-full bg-[#7c3aed] text-white">{displayName[0]?.toUpperCase()}</AvatarFallback></Avatar><ChevronDown className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="mt-3 w-48 rounded-none border-white/20 bg-black/90 p-2 text-white">
                <DropdownMenuLabel className="font-normal text-zinc-400">{displayName}&apos;s profile</DropdownMenuLabel><DropdownMenuSeparator className="bg-white/15" />
                <DropdownMenuItem render={<Link href="/my-list" />} className="cursor-pointer focus:bg-white/15 focus:text-white">My List</DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/account/profile" />} className="cursor-pointer focus:bg-white/15 focus:text-white">Profile</DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/account/settings" />} className="cursor-pointer focus:bg-white/15 focus:text-white">Settings</DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/watch-history" />} className="cursor-pointer focus:bg-white/15 focus:text-white">Watch history</DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/15" />
                <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer justify-center focus:bg-white/15 focus:text-white">Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button render={<Link href="/account/sign-in" />} nativeButton={false} className="h-9 rounded-[4px] border border-white bg-transparent px-3 text-xs sm:h-10 sm:px-5 sm:text-sm font-medium uppercase tracking-[0.1em] text-white hover:bg-white hover:text-[#0d1b3e]">Sign In</Button>
          )}
        </div>
      </div>
      {inCategories && (
        <nav aria-label="Categories" className="absolute inset-x-0 top-full hidden h-11 items-center justify-center gap-9 border-b border-white/10 bg-[#16275a] text-sm font-medium uppercase tracking-[0.12em] md:flex">
          {CATEGORY_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("relative transition-colors hover:text-[#a78bfa]", active ? "text-[#a78bfa]" : "text-zinc-300")}>{item.label}{active && <ActiveBar className="-bottom-1" />}</Link>;
          })}
        </nav>
      )}
    </header>
  );
}

/** Underline that wipes in from the centre when a nav item becomes active. */
function ActiveBar({ className }: { className?: string }) {
  return <motion.span aria-hidden initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className={cn("absolute inset-x-0 h-0.5 bg-[#a78bfa]", className)} />;
}
