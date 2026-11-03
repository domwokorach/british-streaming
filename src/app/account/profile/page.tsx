"use client";

import Link from "next/link";
import { BadgeCheck, ShieldAlert } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { AddressSection } from "@/components/address/address-section";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/providers/auth-provider";

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  return (
    <main className="min-h-dvh bg-ws-bg pb-12 text-white">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 pt-28 sm:px-10">
        <h1 className="text-3xl font-bold">Profile</h1>
        {loading || !user ? <Skeleton className="mt-6 h-40 rounded-md bg-ws-elevated" /> : (
          <>
            <dl className="mt-6 divide-y divide-white/10 rounded-md border border-white/10">
              <div className="p-5"><dt className="text-sm text-ws-text-2">Name</dt><dd className="text-lg">{user.fullName}</dd></div>
              <div className="p-5"><dt className="text-sm text-ws-text-2">Email</dt><dd className="flex flex-wrap items-center gap-2 text-lg">{user.email}
                {user.emailVerified ? <span className="inline-flex items-center gap-1 text-sm text-emerald-300"><BadgeCheck className="size-4" aria-hidden /> Verified</span> : <span className="inline-flex items-center gap-1 text-sm text-amber-300"><ShieldAlert className="size-4" aria-hidden /> Not verified</span>}</dd></div>
              <div className="p-5"><dt className="text-sm text-ws-text-2">Role</dt><dd className="text-lg capitalize">{user.role}</dd></div>
            </dl>
            <AddressSection userId={user.id} />
            <div className="mt-6 flex flex-wrap gap-3">
              <Button render={<Link href="/account/settings" />} nativeButton={false} variant="outline" className="border-white/20 text-white hover:bg-white/10">Security &amp; sessions</Button>
              <Button render={<Link href="/watch-history" />} nativeButton={false} variant="outline" className="border-white/20 text-white hover:bg-white/10">Watch history</Button>
              <Button onClick={() => signOut()} variant="outline" className="border-white/20 text-white hover:bg-white/10">Sign out</Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
