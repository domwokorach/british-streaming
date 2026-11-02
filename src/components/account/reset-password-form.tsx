"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api, type ApiFailure } from "@/lib/auth/client";
import { checkPassword } from "@/lib/auth/password-policy";
import { AuthShell, authLink } from "./auth-shell";
import { AnimatedForm, FormAlert, PasswordField, PasswordStrength, SubmitButton } from "./fields";

export function ResetPasswordForm({ token }: { token?: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState<{ password?: boolean; confirm?: boolean }>({});
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [failure, setFailure] = useState<ApiFailure | null>(null);
  const submitting = useRef(false);

  // Keep the one-time token out of the address bar/history once we've read it.
  useEffect(() => { if (token) window.history.replaceState(null, "", window.location.pathname); }, [token]);

  const policy = checkPassword(password);
  const errors = { password: policy.ok ? undefined : policy.problems[0], confirm: confirm === password ? undefined : "Passwords don't match." };

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setTouched({ password: true, confirm: true });
    if (submitting.current || !token || errors.password || errors.confirm) return;
    submitting.current = true;
    setPending(true);
    setFailure(null);
    const res = await api("/api/auth/reset-password", { method: "POST", body: { token, password } });
    if (res.ok) setDone(true);
    else setFailure(res.error);
    submitting.current = false;
    setPending(false);
  }

  if (!token || failure?.code === "invalid_token") {
    return (
      <AuthShell title="Link expired" subtitle="This password reset link is invalid or has expired." footer={<Link href="/account/sign-in" className={authLink}>← Back to Sign In</Link>}>
        <Link href="/account/forgot-password" className="flex h-12 w-full items-center justify-center rounded-md bg-[#7c3aed] font-semibold text-white hover:bg-[#6d2fd6]">Request a new link</Link>
      </AuthShell>
    );
  }
  if (done) {
    return (
      <AuthShell title="Password updated">
        <FormAlert tone="success" message="Your password was changed and you've been signed out of all devices." />
        <Link href="/account/sign-in?notice=reset" className="flex h-12 w-full items-center justify-center rounded-md bg-[#7c3aed] font-semibold text-white hover:bg-[#6d2fd6]">Return to Sign In</Link>
      </AuthShell>
    );
  }
  return (
    <AuthShell title="Reset password" subtitle="Choose a new password for your account.">
      <FormAlert message={failure ? failure.message : null} />
      <AnimatedForm method="post" onSubmit={onSubmit} noValidate className="space-y-4">
        <PasswordField label="New password" name="password" autoComplete="new-password" required value={password} onChange={setPassword} onBlur={() => setTouched((t) => ({ ...t, password: true }))} error={touched.password ? errors.password ?? failure?.fields?.password : failure?.fields?.password}>
          <PasswordStrength password={password} />
        </PasswordField>
        <PasswordField label="Confirm new password" name="confirm" autoComplete="new-password" required value={confirm} onChange={setConfirm} onBlur={() => setTouched((t) => ({ ...t, confirm: true }))} error={touched.confirm ? errors.confirm : undefined} />
        <SubmitButton pending={pending} pendingLabel="Resetting…">Reset Password</SubmitButton>
      </AnimatedForm>
    </AuthShell>
  );
}
