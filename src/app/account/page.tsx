"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

export default function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/account/sign-in");
  }, [loading, user, router]);

  if (loading || !user) return <main className="min-h-screen bg-[#141414]"><Navbar /></main>;

  return (
    <main className="min-h-screen bg-[#141414] pb-12 text-white">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 pt-28 sm:px-10">
        <h1 className="text-3xl font-bold">Account</h1>
        <div className="mt-6 rounded-md border border-white/10 p-6">
          <p className="text-sm text-zinc-400">Email</p>
          <p className="text-lg">{user.email}</p>
        </div>
        <Button onClick={() => signOut()} variant="outline" className="mt-6 border-white/20 text-white hover:bg-white/10">Sign out</Button>
      </div>
    </main>
  );
}
