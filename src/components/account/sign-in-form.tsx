"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api, type ApiFailure } from "@/lib/auth/client";
import { EMAIL_RE } from "@/lib/auth/password-policy";
import { safeNext } from "@/lib/auth/safe-redirect";
import { useAuth } from "@/providers/auth-provider";
import { AuthShell, authLink } from "./auth-shell";
import { AnimatedForm, FormAlert, PasswordField, SubmitButton, TextField, useHydrated } from "./fields";

export function SignInForm({ next, notice }: { next?: string; notice?: string }) {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const destination = safeNext(next);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [failure, setFailure] = useState<ApiFailure | null>(null);
  const submitting = useRef(false);
  const hydrated = useHydrated();

  // Already signed in (or session restored after a refresh): go where they were headed.
  useEffect(() => { if (user) router.replace(destination); }, [user, destination, router]);

  const emailError = touched.email && !EMAIL_RE.test(email.trim()) ? "Enter a valid email address." : undefined;
  const passwordError = touched.password && !password ? "Enter your password." : undefined;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setTouched({ email: true, password: true });
    if (submitting.current || !EMAIL_RE.test(email.trim()) || !password) return;
    submitting.current = true;
    setPending(true);
    setFailure(null);
    const res = await api("/api/auth/sign-in", { method: "POST", body: { email, password, remember } });
    if (res.ok) {
      setDone(true);
      await refreshUser();
      router.replace(destination);
      router.refresh();
      return; // keep the button disabled while navigating
    }
    setFailure(res.error);
    submitting.current = false;
    setPending(false);
  }

  async function resend() {
    const res = await api("/api/auth/resend-verification", { method: "POST", body: { email } });
    if (res.ok) toast.success("Verification email sent", { description: "Check your inbox (and spam folder)." });
    else toast.error("Couldn't send the email", { description: res.error.message });
  }

  const notices: Record<string, string> = { expired: "Your session expired. Please sign in again.", reset: "Password updated. Sign in with your new password.", verified: "Email verified. You can sign in now." };

  return (
    <AuthShell title="Sign In" subtitle="Welcome back to British Streaming." footer={<>New to British Streaming? <Link href="/account/register" className={authLink}>Create a new account</Link>.</>}>
      <FormAlert tone="success" message={notice && notices[notice] && notice !== "expired" ? notices[notice] : null} />
      <FormAlert tone="info" message={notice === "expired" ? notices.expired : null} />
      <FormAlert message={failure ? failure.message : null} />
      <AnimatedForm method="post" onSubmit={onSubmit} noValidate className="space-y-4">
        <TextField label="Email address" type="email" name="email" autoComplete="email" inputMode="email" required value={email} onChange={setEmail}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))} error={emailError ?? failure?.fields?.email} />
        <PasswordField label="Password" name="password" autoComplete="current-password" required value={password} onChange={setPassword}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))} error={passwordError ?? failure?.fields?.password} />
        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-ws-text">
            <input type="checkbox" disabled={!hydrated} checked={remember} onChange={(e) => setRemember(e.target.checked)} className="size-5 accent-ws-blue" /> Remember me
          </label>
          <Link href="/account/forgot-password" className={authLink}>Forgot password?</Link>
        </div>
        {failure?.code === "email_not_verified" && (
          <button type="button" onClick={resend} className={`${authLink} text-sm`}>Resend verification email</button>
        )}
        <SubmitButton pending={pending} success={done} successLabel="Signed in" pendingLabel="Signing in…">Sign In</SubmitButton>
      </AnimatedForm>
    </AuthShell>
  );
}
