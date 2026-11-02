"use client";

import { Eye, EyeOff } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Children, useId, useState, useSyncExternalStore } from "react";
import { Spinner } from "@/components/ui/spinner";
import { checkPassword } from "@/lib/auth/password-policy";
import { EASE, SPRING } from "@/lib/motion";
import { cn } from "cn";

const subscribe = () => () => {};
/** False during SSR and until React has hydrated. Typing or clicking before then is silently lost, so controls wait for it. */
export function useHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

const inputClass = "h-12 w-full rounded-md border bg-[#1b2a52] px-3 text-base text-white placeholder:text-zinc-400 outline-none transition-[border-color,box-shadow] duration-150 focus-visible:border-[#a78bfa] focus-visible:ring-4 focus-visible:ring-[#7c3aed]/30 disabled:opacity-60";

interface FieldProps extends Omit<React.ComponentProps<"input">, "onChange"> {
  label: string;
  error?: string;
  hint?: string;
  onChange: (value: string) => void;
}

export function TextField({ label, error, hint, onChange, className, ...props }: FieldProps) {
  const id = useId();
  const hydrated = useHydrated();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-100">{label}</label>
      <input id={id} readOnly={!hydrated} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined} onChange={(e) => onChange(e.target.value)}
        className={cn(inputClass, error ? "border-red-400" : "border-white/20", className)} {...props} />
      {hint && !error && <p id={`${id}-hint`} className="mt-1.5 text-xs text-zinc-400">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="mt-1.5 text-sm text-red-300">{error}</p>}
    </div>
  );
}

export function PasswordField({ label, error, onChange, children, ...props }: FieldProps & { children?: React.ReactNode }) {
  const id = useId();
  const hydrated = useHydrated();
  const [shown, setShown] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-100">{label}</label>
      <div className="relative">
        <input id={id} readOnly={!hydrated} type={shown ? "text" : "password"} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-err` : undefined} onChange={(e) => onChange(e.target.value)}
          className={cn(inputClass, "pr-12", error ? "border-red-400" : "border-white/20")} {...props} />
        <button type="button" onClick={() => setShown((s) => !s)} aria-label={shown ? "Hide password" : "Show password"} aria-pressed={shown}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-md text-zinc-300 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-[#a78bfa]">
          <AnimatePresence initial={false} mode="wait">
            <motion.span key={shown ? "hide" : "show"} initial={{ opacity: 0, rotate: -20, scale: 0.8 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: 20, scale: 0.8 }} transition={{ duration: 0.12 }} className="flex">
              {shown ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
      {children}
      {error && <p id={`${id}-err`} role="alert" className="mt-1.5 text-sm text-red-300">{error}</p>}
    </div>
  );
}

const SEGMENT = ["bg-red-500", "bg-orange-500", "bg-yellow-400", "bg-lime-400", "bg-emerald-400"];

export function PasswordStrength({ password, email, name }: { password: string; email?: string; name?: string }) {
  if (!password) return null;
  const check = checkPassword(password, { email, name });
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1" aria-hidden>
        {[1, 2, 3, 4].map((i) => <span key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors duration-300", check.score >= i ? SEGMENT[check.score] : "bg-white/15")} />)}
      </div>
      <p className="mt-1 text-xs text-zinc-300">Password strength: <strong className="text-white">{check.label}</strong>{check.problems[0] ? ` — ${check.problems[0]}` : ""}</p>
    </div>
  );
}

export function SubmitButton({ pending, children, pendingLabel }: { pending: boolean; children: React.ReactNode; pendingLabel: string }) {
  const hydrated = useHydrated();
  const disabled = pending || !hydrated;
  return (
    <motion.button type="submit" disabled={disabled} aria-busy={pending}
      whileHover={disabled ? undefined : { scale: 1.015 }} whileTap={disabled ? undefined : { scale: 0.97 }} transition={SPRING.press}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#7c3aed] px-4 text-base font-semibold text-white transition-colors duration-150 hover:bg-[#6d2fd6] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
      {pending ? (<><Spinner className="size-5" aria-hidden /> {pendingLabel}</>) : children}
    </motion.button>
  );
}

export function FormAlert({ message, tone = "error" }: { message: string | null; tone?: "error" | "success" | "info" }) {
  if (!message) return null;
  const styles = { error: "border-red-400/40 bg-red-500/10 text-red-100", success: "border-emerald-400/40 bg-emerald-500/10 text-emerald-100", info: "border-white/20 bg-white/5 text-zinc-100" };
  // Errors get a brief horizontal shake to draw the eye; everything else eases in. Transform/opacity only.
  return (
    <motion.div role={tone === "error" ? "alert" : "status"} data-reveal
      initial={{ opacity: 0, y: -8 }}
      animate={tone === "error" ? { opacity: 1, y: 0, x: [0, -7, 7, -4, 4, 0] } : { opacity: 1, y: 0 }}
      transition={tone === "error" ? { duration: 0.45, ease: EASE.out } : SPRING.soft}
      className={cn("mb-4 rounded-md border px-3 py-2.5 text-sm", styles[tone])}>
      {message}
    </motion.div>
  );
}

const formContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } };
const formItem = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: SPRING.soft } };

/**
 * A normal <form> whose direct children ease in one after another. Purely visual: the form is rendered, labelled
 * and submittable immediately, and animation never gates focus, input or submission.
 */
export function AnimatedForm({ children, ...props }: React.ComponentProps<"form">) {
  return (
    <motion.div initial="hidden" animate="visible" variants={formContainer}>
      <form {...props}>
        {Children.toArray(children).map((child, i) => (
          <motion.div key={i} variants={formItem} data-reveal>{child}</motion.div>
        ))}
      </form>
    </motion.div>
  );
}
