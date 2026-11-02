"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { api, type ApiFailure } from "@/lib/auth/client";
import { EMAIL_RE } from "@/lib/auth/password-policy";
import { AuthShell, authLink } from "./auth-shell";
import { AnimatedForm, FormAlert, SubmitButton, TextField } from "./fields";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [failure, setFailure] = useState<ApiFailure | null>(null);
  const submitting = useRef(false);
  const emailError = touched && !EMAIL_RE.test(email.trim()) ? "Enter a valid email address." : undefined;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (submitting.current || !EMAIL_RE.test(email.trim())) return;
    submitting.current = true;
    setPending(true);
    setFailure(null);
    const res = await api("/api/auth/forgot-password", { method: "POST", body: { email } });
    if (res.ok) setSent(true);
    else setFailure(res.error);
    submitting.current = false;
    setPending(false);
  }

  return (
    <AuthShell title="Forgot password" subtitle="Enter your email and we'll send you a link to reset it." footer={<Link href="/account/sign-in" className={authLink}>← Back to Sign In</Link>}>
      {sent ? (
        <FormAlert tone="success" message="If an account exists for that email, a password reset link is on its way. It expires soon and works once." />
      ) : (
        <>
          <FormAlert message={failure ? failure.message : null} />
          <AnimatedForm method="post" onSubmit={onSubmit} noValidate className="space-y-4">
            <TextField label="Email address" type="email" name="email" autoComplete="email" inputMode="email" required value={email} onChange={setEmail} onBlur={() => setTouched(true)} error={emailError} />
            <SubmitButton pending={pending} pendingLabel="Sending…">Send Reset Link</SubmitButton>
          </AnimatedForm>
        </>
      )}
    </AuthShell>
  );
}
