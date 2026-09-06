"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = mode === "sign-up"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(mode === "sign-up" ? "Couldn't create account" : "Couldn't sign in", { description: error.message });
        return;
      }
      if (mode === "sign-up") toast.success("Check your email to confirm your account.");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Something went wrong", { description: "Check that Supabase is configured, then try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm rounded-md bg-black/75 p-8 text-white">
      <h1 className="mb-6 text-2xl font-bold">{mode === "sign-up" ? "Create account" : "Sign In"}</h1>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 border-white/20 bg-[#333] text-white" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required minLength={6} autoComplete={mode === "sign-up" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 border-white/20 bg-[#333] text-white" />
        </div>
        <Button type="submit" disabled={submitting} className="h-11 w-full bg-[#e50914] font-semibold text-white hover:bg-[#e50914]/85">
          {submitting ? "Please wait…" : mode === "sign-up" ? "Sign Up" : "Sign In"}
        </Button>
      </div>
      <p className="mt-6 text-sm text-zinc-400">
        {mode === "sign-up" ? (
          <>Already have an account? <Link href="/account/sign-in" className="text-white hover:underline">Sign in</Link>.</>
        ) : (
          <>New to StreamFlix? <Link href="/account/sign-up" className="text-white hover:underline">Sign up now</Link>.</>
        )}
      </p>
    </form>
  );
}
