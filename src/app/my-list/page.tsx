"use client";

import Link from "next/link";
import { ContentRow } from "@/components/content/content-row";
import { NAV_SCROLL_MARGIN_CLASS } from "@/lib/nav-targets";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyList } from "@/hooks/use-my-list";
import { useResolvedTitles } from "@/hooks/use-resolved-titles";
import { useAuth } from "@/providers/auth-provider";

export default function MyListPage() {
  const { user, loading: authLoading } = useAuth();
  const { entries, loading: listLoading } = useMyList();
  const { titles, loading: titlesLoading } = useResolvedTitles(entries);
  const loading = authLoading || (Boolean(user) && (listLoading || titlesLoading));

  return (
    <main className="min-h-screen bg-ws-bg pb-12 text-white">
      <Navbar />
      <div className="pt-28">
        <div id="my-list-content" className={NAV_SCROLL_MARGIN_CLASS}>
        <h1 className="px-4 text-3xl font-bold sm:px-10">My List</h1>
        
        {!authLoading && !user && (
          <div className="px-4 pt-6 sm:px-10">
            <p className="text-ws-text-2">Sign in to save titles to your list.</p>
            <Button render={<Link href="/account/sign-in" />} nativeButton={false} className="mt-4 bg-ws-blue font-semibold text-white hover:bg-ws-blue/85">Sign In</Button>
          </div>
        )}
        {user && loading && (
          <div className="flex gap-3 px-4 pt-6 sm:px-10">
            {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="aspect-video w-64 rounded bg-ws-elevated" />)}
          </div>
        )}
        {user && !loading && titles.length === 0 && <p className="px-4 pt-6 text-ws-text-2 sm:px-10">Your list is empty. Add titles with the + button on any title.</p>}
        {user && !loading && titles.length > 0 && <ContentRow row={{ title: "Saved for You", items: titles }} />}
        </div>
      </div>
      <Footer />
    </main>
  );
}
