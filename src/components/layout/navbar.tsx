"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "cn";
import { BRAND } from "@/lib/brand";
import { useAuth } from "@/providers/auth-provider";
import { MobileNav } from "./mobile-nav";
import { NavLink } from "./nav-link";
import { NotificationDropdown } from "./notification-dropdown";
import { SearchBar } from "./search-bar";

const menuItemClass = "cursor-pointer focus:bg-white/15 focus:text-white";

export function Navbar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const displayName = user?.fullName ?? "Guest";

  // Transparent over the hero, solid black once the page scrolls.
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[var(--z-header,40)] h-[calc(64px+env(safe-area-inset-top))] px-[max(1rem,env(safe-area-inset-left))] pt-[env(safe-area-inset-top)] transition-[background-color,box-shadow] duration-300 ease-out motion-reduce:transition-none sm:px-[58px]",
        scrolled ? "bg-ws-bg/95 shadow-[0_6px_20px_-8px_rgba(124,58,237,0.45)] backdrop-blur-sm" : "bg-gradient-to-b from-ws-bg via-ws-bg/70 to-transparent"
      )}
    >
      <div className="mx-auto flex h-full max-w-[2400px] items-center gap-2 sm:gap-5">
        <MobileNav />
        <Link href="/" aria-label={`${BRAND.name} home`} className="shrink-0 whitespace-nowrap text-[14px] font-black leading-none tracking-[-0.02em] min-[360px]:text-[16px] bg-gradient-to-r from-ws-blue-light via-ws-purple-electric to-ws-lavender bg-clip-text text-transparent min-[400px]:text-[20px] sm:text-[24px]">{BRAND.name}</Link>
        <nav aria-label="Primary" className="ml-2 hidden min-w-0 items-center gap-1 whitespace-nowrap text-[15px] lg:flex">
          {NAV_ITEMS.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <NavLink
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn("relative whitespace-nowrap rounded-full px-2.5 py-2 transition-colors duration-150 lg:px-4", active ? "font-medium text-white" : "text-ws-text-2 hover:text-ws-lavender after:absolute after:inset-x-4 after:bottom-1 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-ws-purple after:transition-transform after:duration-200 hover:after:scale-x-100 focus-visible:after:scale-x-100 motion-reduce:after:transition-none")}
              >
                {active && <motion.span layoutId="nav-active-pill" aria-hidden transition={{ type: "spring", stiffness: 420, damping: 34 }} className="absolute inset-0 rounded-full bg-ws-elevated shadow-[inset_0_-2px_0_var(--ws-blue)]" />}
                <span className="relative">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-3">
          <SearchBar />
          <div className="hidden min-[360px]:block"><div className="hidden sm:block"><NotificationDropdown /></div></div>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" aria-label="Account menu" className="h-11 gap-1.5 px-1 text-white hover:bg-transparent" />}>
                <Avatar className="size-8 rounded-[4px]"><AvatarFallback className="rounded-[4px] bg-ws-blue text-white">{displayName[0]?.toUpperCase()}</AvatarFallback></Avatar>
                <ChevronDown className="size-4" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="mt-2 w-52 rounded-[4px] border-white/15 bg-ws-card p-2 text-white">
                <DropdownMenuLabel className="font-normal text-ws-text-2">{displayName}&apos;s profile</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/15" />
                <DropdownMenuItem render={<Link href="/my-list" />} className={menuItemClass}>My List</DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/account/profile" />} className={menuItemClass}>Profile</DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/account/settings" />} className={menuItemClass}>Settings</DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/watch-history" />} className={menuItemClass}>Watch history</DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/15" />
                <DropdownMenuItem onClick={() => signOut()} className={cn(menuItemClass, "justify-center")}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button render={<Link href="/account/sign-in" />} nativeButton={false} className="h-9 rounded-[4px] bg-ws-blue px-3 text-sm sm:px-4 font-medium text-white hover:bg-ws-blue/85">Sign In</Button>
          )}
        </div>
      </div>
      <div aria-hidden className={cn("pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-ws-blue via-ws-purple-electric to-ws-blue transition-opacity duration-300 motion-reduce:transition-none", scrolled ? "opacity-70" : "opacity-0")} />
    </header>
  );
}
