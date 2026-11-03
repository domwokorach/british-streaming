"use client";

import { LocateFixed } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { validateAddress, type Address, type AddressErrors, type AddressField } from "@/lib/address";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "cn";
import { AddressIcon, AddressIconButton } from "./address-icon";

interface Suggestion { label: string; address: Address }

interface AddressInputProps {
  value: Address;
  onChange: (address: Address) => void;
  /** Reveal every field's error now, e.g. after a failed submit. */
  showAllErrors?: boolean;
  disabled?: boolean;
  className?: string;
}

// The location service is optional, so ask the server once and share the answer.
let statusPromise: Promise<boolean> | null = null;
const placesConfigured = () => (statusPromise ??= fetch("/api/places/status").then((r) => r.json()).then((b: { configured?: boolean }) => Boolean(b.configured)).catch(() => false));

const inputClass = "h-12 w-full rounded-md border bg-ws-elevated px-3 text-base text-white placeholder:text-ws-text-2 outline-none transition-[border-color,box-shadow] duration-150 focus-visible:border-ws-blue-light focus-visible:ring-4 focus-visible:ring-ws-blue/30 disabled:opacity-60";

export function AddressInput({ value, onChange, showAllErrors = false, disabled, className }: AddressInputProps) {
  const uid = useId();
  const [touched, setTouched] = useState<Partial<Record<AddressField, boolean>>>({});
  const [configured, setConfigured] = useState(false);
  const [streetFocused, setStreetFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [active, setActive] = useState(-1);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const skipNextSearch = useRef(false);

  const errors: AddressErrors = validateAddress(value);
  const visibleError = (field: AddressField) => (showAllErrors || touched[field] ? errors[field] : undefined);

  useEffect(() => {
    let live = true;
    void placesConfigured().then((ok) => live && setConfigured(ok));
    return () => { live = false; };
  }, []);

  // Debounced autocomplete on the street field.
  useEffect(() => {
    if (!configured || !streetFocused || skipNextSearch.current) { skipNextSearch.current = false; return; }
    const q = value.street.trim();
    if (q.length < 3) { queueMicrotask(() => setSuggestions([])); return; }
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = (abortRef.current = new AbortController());
      try {
        const res = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (!res.ok) return setSuggestions([]);
        const body = (await res.json()) as { suggestions: Suggestion[] };
        setSuggestions(body.suggestions);
        setActive(-1);
      } catch { /* aborted or offline: keep manual entry working */ }
    }, 300);
    return () => clearTimeout(timer);
  }, [value.street, configured, streetFocused]);

  const set = (field: AddressField) => (next: string) => onChange({ ...value, [field]: next });
  const blur = (field: AddressField) => () => setTouched((t) => ({ ...t, [field]: true }));

  function pick(suggestion: Suggestion) {
    skipNextSearch.current = true;
    onChange(suggestion.address);
    setTouched({ street: true, city: true, region: true, postalCode: true, country: true });
    setSuggestions([]);
  }

  const locate = useCallback(() => {
    setLocateError(null);
    if (!("geolocation" in navigator)) return setLocateError("Your browser doesn't support location.");
    setLocating(true);
    // Only runs from a click, so the browser's permission prompt is always user-initiated.
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(`/api/places/reverse?lat=${coords.latitude}&lon=${coords.longitude}`);
          const body = (await res.json()) as { address?: Address };
          if (!res.ok || !body.address) throw new Error();
          skipNextSearch.current = true;
          onChange(body.address);
          setTouched({ street: true, city: true, region: true, postalCode: true, country: true });
        } catch { setLocateError("Couldn't find an address for your location."); }
        finally { setLocating(false); }
      },
      (err) => {
        setLocating(false);
        setLocateError(err.code === err.PERMISSION_DENIED ? "Location permission was denied. Enter your address manually." : "Couldn't get your location. Try again or enter it manually.");
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  }, [onChange]);

  function onStreetKey(event: React.KeyboardEvent) {
    if (suggestions.length === 0) return;
    if (event.key === "ArrowDown") { event.preventDefault(); setActive((i) => (i + 1) % suggestions.length); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1)); }
    else if (event.key === "Enter" && active >= 0) { event.preventDefault(); pick(suggestions[active]); }
    else if (event.key === "Escape") setSuggestions([]);
  }

  const listId = `${uid}-suggestions`;
  const open = suggestions.length > 0 && streetFocused;

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label htmlFor={`${uid}-street`} className="text-sm font-medium text-ws-text">Street address</label>
          {configured && (
            <span className="-my-2 flex items-center">
              {locating ? <span className="flex size-10 items-center justify-center"><Spinner className="size-4" /></span> : <AddressIconButton label="Use my current location" onClick={locate} disabled={disabled} icon={<LocateFixed className="size-4 sm:size-5" />} />}
            </span>
          )}
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"><AddressIcon active={streetFocused} /></span>
          <input
            id={`${uid}-street`}
            role={configured ? "combobox" : undefined}
            aria-expanded={configured ? open : undefined}
            aria-controls={configured ? listId : undefined}
            aria-autocomplete={configured ? "list" : undefined}
            aria-activedescendant={open && active >= 0 ? `${uid}-opt-${active}` : undefined}
            aria-invalid={Boolean(visibleError("street"))}
            aria-describedby={visibleError("street") ? `${uid}-street-err` : undefined}
            autoComplete="street-address"
            placeholder="123 High Street"
            disabled={disabled}
            value={value.street}
            onChange={(e) => set("street")(e.target.value)}
            onFocus={() => setStreetFocused(true)}
            onBlur={() => { setStreetFocused(false); blur("street")(); setSuggestions([]); }}
            onKeyDown={onStreetKey}
            className={cn(inputClass, "pl-10 sm:pl-11", visibleError("street") ? "border-red-400" : "border-white/20")}
          />
          <AnimatePresence>
            {open && (
              <motion.ul
                id={listId}
                role="listbox"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-x-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-md border border-white/15 bg-ws-card py-1 shadow-2xl"
              >
                {suggestions.map((s, i) => (
                  // mouseDown (not click) so the pick lands before the input's blur clears the list.
                  <li key={`${s.label}-${i}`} id={`${uid}-opt-${i}`} role="option" aria-selected={i === active} onMouseDown={(e) => { e.preventDefault(); pick(s); }} onMouseEnter={() => setActive(i)}
                    className={cn("flex cursor-pointer items-start gap-2 px-3 py-2.5 text-sm", i === active ? "bg-ws-blue/25 text-white" : "text-ws-text")}>
                    <AddressIcon className="mt-0.5" /> <span className="min-w-0 break-words">{s.label}</span>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
        <FieldError id={`${uid}-street-err`} message={visibleError("street")} />
        <p role="status" className="mt-1.5 text-sm text-amber-300 empty:hidden">{locateError}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field uid={uid} label="City" field="city" autoComplete="address-level2" placeholder="London" value={value.city} error={visibleError("city")} disabled={disabled} onChange={set("city")} onBlur={blur("city")} />
        <Field uid={uid} label="State / Region" field="region" autoComplete="address-level1" placeholder="Greater London" value={value.region} error={visibleError("region")} disabled={disabled} onChange={set("region")} onBlur={blur("region")} />
        <Field uid={uid} label="Postal code" field="postalCode" autoComplete="postal-code" placeholder="SW1A 1AA" value={value.postalCode} error={visibleError("postalCode")} disabled={disabled} onChange={set("postalCode")} onBlur={blur("postalCode")} />
        <Field uid={uid} label="Country" field="country" autoComplete="country-name" placeholder="United Kingdom" value={value.country} error={visibleError("country")} disabled={disabled} onChange={set("country")} onBlur={blur("country")} />
      </div>
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <AnimatePresence initial={false}>
      {message && <motion.p id={id} role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="mt-1.5 text-sm text-red-300">{message}</motion.p>}
    </AnimatePresence>
  );
}

interface FieldProps {
  uid: string;
  label: string;
  field: AddressField;
  value: string;
  error?: string;
  autoComplete: string;
  placeholder: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
}

function Field({ uid, label, field, value, error, autoComplete, placeholder, disabled, onChange, onBlur }: FieldProps) {
  const id = `${uid}-${field}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ws-text">{label}</label>
      <input id={id} value={value} autoComplete={autoComplete} placeholder={placeholder} disabled={disabled} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-err` : undefined}
        onChange={(e) => onChange(e.target.value)} onBlur={onBlur} className={cn(inputClass, error ? "border-red-400" : "border-white/20")} />
      <FieldError id={`${id}-err`} message={error} />
    </div>
  );
}
