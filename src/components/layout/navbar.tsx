"use client";

import { Bell, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NAV_ITEMS } from "@/lib/constants";
import { useAuth } from "@/providers/auth-provider";
import { MobileNav } from "./mobile-nav";
import { SearchBar } from "./search-bar";

export function Navbar() {
  const { user, signOut } = useAuth();
  const displayName = (user?.user_metadata?.display_name as string | undefined) ?? user?.email?.split("@")[0] ?? "Guest";

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-[68px] bg-gradient-to-b from-black/85 to-transparent px-4 transition-colors sm:px-10">
      <div className="mx-auto flex h-full max-w-[1920px] items-center gap-6">
        <MobileNav />
        <Link href="/" aria-label="Netflix home" className="shrink-0 text-[23px] font-black tracking-[-0.13em] text-[#e50914] sm:text-[27px]">NETFLIX</Link>
        <nav className="hidden items-center gap-5 text-[13px] text-zinc-300 md:flex">{NAV_ITEMS.map((item, index) => <Link key={item.href} href={item.href} className={index === 0 ? "font-semibold text-white" : "transition-colors hover:text-zinc-400"}>{item.label}</Link>)}</nav>
        <div className="ml-auto flex items-center gap-3">
          <SearchBar />
          <Button variant="ghost" size="icon" aria-label="Notifications" className="hidden text-white hover:bg-white/10 sm:flex"><Bell className="size-5 fill-current" /></Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" className="h-auto gap-1 p-0 text-white hover:bg-transparent" />}>
                <Avatar className="size-8 rounded-sm"><AvatarImage src={user.user_metadata?.avatar_url as string | undefined} alt={`${displayName}'s profile`} /><AvatarFallback className="rounded-sm bg-rose-800">{displayName[0]?.toUpperCase()}</AvatarFallback></Avatar><ChevronDown className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="mt-3 w-48 rounded-none border-white/20 bg-black/90 p-2 text-white">
                <DropdownMenuLabel className="font-normal text-zinc-400">{displayName}&apos;s profile</DropdownMenuLabel><DropdownMenuSeparator className="bg-white/15" />
                <DropdownMenuItem render={<Link href="/my-list" />} className="cursor-pointer focus:bg-white/15 focus:text-white">My List</DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/account" />} className="cursor-pointer focus:bg-white/15 focus:text-white">Account</DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/15" />
                <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer justify-center focus:bg-white/15 focus:text-white">Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button render={<Link href="/account/sign-in" />} nativeButton={false} className="h-8 rounded-md bg-[#e50914] px-4 text-sm font-semibold text-white hover:bg-[#e50914]/85">Sign In</Button>
          )}
        </div>
      </div>
    </header>
  );
}
