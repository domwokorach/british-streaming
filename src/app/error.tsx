"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { reset: () => void }) {
  return <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#141414] px-6 text-center text-white"><h1 className="text-2xl font-semibold">We&apos;re having trouble loading titles.</h1><p className="text-zinc-400">Please try again in a moment.</p><Button onClick={reset} className="bg-white text-black hover:bg-zinc-200">Try again</Button></main>;
}
