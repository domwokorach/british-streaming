"use client";

import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EMPTY_ADDRESS, isAddressEmpty, validateAddress, type Address } from "@/lib/address";
import { AddressDisplay } from "./address-display";
import { AddressIcon } from "./address-icon";
import { AddressInput } from "./address-input";

const storageKey = (userId: string) => `ws:address:${userId}`;

/** Profile card for a user's address. Stored in this browser only (there is no address field in the account API yet). */
export function AddressSection({ userId }: { userId: string }) {
  const [saved, setSaved] = useState<Address | null>(null);
  const [draft, setDraft] = useState<Address>(EMPTY_ADDRESS);
  const [editing, setEditing] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = localStorage.getItem(storageKey(userId));
        if (raw) setSaved({ ...EMPTY_ADDRESS, ...(JSON.parse(raw) as Partial<Address>) });
      } catch { /* corrupt or blocked storage: treat as no address */ }
    });
  }, [userId]);

  function save(event: React.FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(validateAddress(draft)).length > 0) return;
    try { localStorage.setItem(storageKey(userId), JSON.stringify(draft)); } catch { return void toast.error("Couldn't save your address in this browser."); }
    setSaved(draft);
    setEditing(false);
    toast.success("Address saved");
  }

  function startEditing() {
    setDraft(saved ?? EMPTY_ADDRESS);
    setSubmitted(false);
    setEditing(true);
  }

  return (
    <section aria-labelledby="address-heading" className="mt-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="address-heading" className="flex items-center gap-2 text-xl font-semibold"><AddressIcon active /> Address</h2>
        {!editing && <Button type="button" variant="outline" onClick={startEditing} className="h-10 gap-2 border-white/20 text-white hover:bg-white/10"><Pencil className="size-4" /> {saved && !isAddressEmpty(saved) ? "Edit" : "Add address"}</Button>}
      </div>
      {editing ? (
        <form onSubmit={save} noValidate className="space-y-4 rounded-lg border border-white/10 p-4 sm:p-5">
          <AddressInput value={draft} onChange={setDraft} showAllErrors={submitted} />
          <div className="flex flex-wrap gap-3">
            <Button type="submit" className="h-11 bg-[#7c3aed] px-6 font-semibold text-white hover:bg-[#7c3aed]/85">Save address</Button>
            <Button type="button" variant="outline" onClick={() => setEditing(false)} className="h-11 border-white/20 text-white hover:bg-white/10">Cancel</Button>
          </div>
        </form>
      ) : saved && !isAddressEmpty(saved) ? (
        <AddressDisplay address={saved} showMapPreview />
      ) : (
        <p className="rounded-lg border border-dashed border-white/15 p-4 text-sm text-zinc-400">No address saved yet.</p>
      )}
    </section>
  );
}
