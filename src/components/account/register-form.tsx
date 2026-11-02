"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { api, type ApiFailure } from "@/lib/auth/client";
import { checkPassword, EMAIL_RE } from "@/lib/auth/password-policy";
import { AuthShell, authLink } from "./auth-shell";
import { AnimatedForm, FormAlert, PasswordField, PasswordStrength, SubmitButton, TextField, useHydrated } from "./fields";

type Touched = Partial<Record<"fullName" | "email" | "password" | "confirm" | "terms", boolean>>;

export function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [touched, setTouched] = useState<Touched>({});
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<ApiFailure | null>(null);
  const submitting = useRef(false);
  const hydrated = useHydrated();
  const touch = (k: keyof Touched) => () => setTouched((t) => ({ ...t, [k]: true }));

  const policy = checkPassword(password, { email, name: fullName });
  const errors = {
    fullName: !fullName.trim() ? "Enter your full name." : undefined,
    email: !EMAIL_RE.test(email.trim()) ? "Enter a valid email address." : undefined,
    password: !policy.ok ? policy.problems[0] : undefined,
    confirm: confirm !== password ? "Passwords don't match." : undefined,
    terms: !terms ? "You must accept the Terms and Conditions." : undefined,
  };
  const show = (k: keyof Touched) => (touched[k] ? errors[k] : undefined);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setTouched({ fullName: true, email: true, password: true, confirm: true, terms: true });
    if (submitting.current || Object.values(errors).some(Boolean)) return;
    submitting.current = true;
    setPending(true);
    setFailure(null);
    const res = await api("/api/auth/register", { method: "POST", body: { fullName, email, password, acceptTerms: terms } });
    if (res.ok) {
      router.replace(`/account/verify-email?sent=1&email=${encodeURIComponent(email.trim().toLowerCase())}`);
      return;
    }
    setFailure(res.error);
    submitting.current = false;
    setPending(false);
  }

  return (
    <AuthShell title="Create account" subtitle="Start streaming in a minute." footer={<>Already have an account? <Link href="/account/sign-in" className={authLink}>Sign in</Link>.</>}>
      <FormAlert message={failure && !failure.fields ? failure.message : null} />
      <AnimatedForm method="post" onSubmit={onSubmit} noValidate className="space-y-4">
        <TextField label="Full name" name="fullName" autoComplete="name" required value={fullName} onChange={setFullName} onBlur={touch("fullName")} error={show("fullName") ?? failure?.fields?.fullName} />
        <TextField label="Email address" type="email" name="email" autoComplete="email" inputMode="email" required value={email} onChange={setEmail} onBlur={touch("email")} error={show("email") ?? failure?.fields?.email} />
        <PasswordField label="Password" name="password" autoComplete="new-password" required value={password} onChange={setPassword} onBlur={touch("password")} error={show("password") ?? failure?.fields?.password}>
          <PasswordStrength password={password} email={email} name={fullName} />
        </PasswordField>
        <PasswordField label="Confirm password" name="confirm" autoComplete="new-password" required value={confirm} onChange={setConfirm} onBlur={touch("confirm")} error={show("confirm")} />
        <div>
          <label className="flex min-h-11 cursor-pointer items-start gap-2 text-sm text-zinc-100">
            <input type="checkbox" name="terms" disabled={!hydrated} checked={terms} onChange={(e) => { setTerms(e.target.checked); touch("terms")(); }} aria-invalid={Boolean(show("terms"))} className="mt-0.5 size-5 shrink-0 accent-[#7c3aed]" />
            <span>I agree to the <Link href="/terms" className={authLink}>Terms and Conditions</Link> and <Link href="/privacy" className={authLink}>Privacy Policy</Link>.</span>
          </label>
          {show("terms") && <p role="alert" className="mt-1 text-sm text-red-300">{show("terms")}</p>}
        </div>
        <SubmitButton pending={pending} pendingLabel="Creating account…">Create Account</SubmitButton>
      </AnimatedForm>
    </AuthShell>
  );
}
