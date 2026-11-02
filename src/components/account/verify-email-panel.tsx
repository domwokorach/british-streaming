"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/auth/client";
import { AuthShell, authLink } from "./auth-shell";
import { FormAlert } from "./fields";

type State = "verifying" | "verified" | "failed" | "idle";

/** Without a token: "check your inbox" + resend. With a token: verifies on load (POST, so link scanners can't consume it). */
export function VerifyEmailPanel({ token, email, sent }: { token?: string; email?: string; sent?: boolean }) {
  const [state, setState] = useState<State>(token ? "verifying" : "idle");
  const [cooldown, setCooldown] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    window.history.replaceState(null, "", window.location.pathname);
    void api("/api/auth/verify-email", { method: "POST", body: { token } }).then((res) => setState(res.ok ? "verified" : "failed"));
  }, [token]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function resend() {
    if (!email) return;
    const res = await api("/api/auth/resend-verification", { method: "POST", body: { email } });
    if (res.ok) { toast.success("If that account needs verifying, a new email is on its way."); setCooldown(30); }
    else toast.error("Couldn't resend", { description: res.error.message });
  }

  if (state === "verifying") return <AuthShell title="Verifying…"><p role="status" className="text-zinc-300">Confirming your email address.</p></AuthShell>;
  if (state === "verified") {
    return (
      <AuthShell title="Email verified">
        <FormAlert tone="success" message="Thanks — your email address is confirmed." />
        <Link href="/account/sign-in?notice=verified" className="flex h-12 w-full items-center justify-center rounded-md bg-[#7c3aed] font-semibold text-white hover:bg-[#6d2fd6]">Continue to Sign In</Link>
      </AuthShell>
    );
  }
  return (
    <AuthShell title={state === "failed" ? "Link expired" : "Check your email"} subtitle={state === "failed" ? "This verification link is invalid or has expired." : undefined}
      footer={<Link href="/account/sign-in" className={authLink}>← Back to Sign In</Link>}>
      {state === "idle" && <FormAlert tone="success" message={sent ? `We've sent a verification link${email ? ` to ${email}` : ""}. Click it to activate your account.` : "Open the verification link we emailed you to activate your account."} />}
      {email ? (
        <button type="button" onClick={resend} disabled={cooldown > 0} className="flex h-12 w-full items-center justify-center rounded-md border border-white/30 font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-60">
          {cooldown > 0 ? `Resend available in ${cooldown}s` : "Resend verification email"}
        </button>
      ) : (
        <p className="text-sm text-zinc-300">Need a new link? <Link href="/account/sign-in" className={authLink}>Sign in</Link> and choose “Resend verification email”.</p>
      )}
    </AuthShell>
  );
}
