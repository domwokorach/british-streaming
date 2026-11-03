"use client";

import { Check, Copy, ExternalLink, Map } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { addressLines, formatAddress, mapsEmbedUrl, mapsSearchUrl, type Address } from "@/lib/address";
import { cn } from "cn";
import { AddressIcon, AddressIconButton } from "./address-icon";

interface AddressDisplayProps {
  address: Address;
  /** Show the toggleable embedded map. Off by default because it loads a third-party frame. */
  showMapPreview?: boolean;
  className?: string;
}

export function AddressDisplay({ address, showMapPreview = false, className }: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lines = addressLines(address);
  if (lines.length === 0) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(formatAddress(address));
      setCopied(true);
      toast.success("Address copied");
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy the address. Select it and copy manually.");
    }
  }

  return (
    <div className={cn("rounded-lg border border-white/10 bg-ws-card/60 p-3 sm:p-4", className)}>
      <div className="flex items-start gap-3">
        <span className="mt-1.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-ws-blue/20 sm:size-9"><AddressIcon active /></span>
        <address className="min-w-0 flex-1 py-1 text-sm not-italic leading-6 text-white sm:text-base">
          {lines.map((line, index) => <span key={index} className={cn("block break-words", index > 0 && "text-ws-text")}>{line}</span>)}
        </address>
        <div className="-mr-1 flex shrink-0 items-center">
          <AddressIconButton label={copied ? "Copied" : "Copy address"} onClick={copy} icon={copied ? <Check className="size-4 text-emerald-300 sm:size-5" /> : <Copy className="size-4 sm:size-5" />} />
          <AddressIconButton href={mapsSearchUrl(address)} label="Open in Google Maps" icon={<ExternalLink className="size-4 sm:size-5" />} />
          {showMapPreview && (
            <AddressIconButton label={mapOpen ? "Hide map preview" : "Show map preview"} aria-expanded={mapOpen} onClick={() => setMapOpen((open) => !open)} icon={<Map className="size-4 sm:size-5" />} className={mapOpen ? "bg-white/10 text-ws-blue-light" : undefined} />
          )}
        </div>
      </div>
      <p className="sr-only" role="status">{copied ? "Address copied to clipboard" : ""}</p>
      <AnimatePresence initial={false}>
        {showMapPreview && mapOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} className="overflow-hidden">
            <iframe title={`Map of ${formatAddress(address)}`} src={mapsEmbedUrl(address)} loading="lazy" referrerPolicy="no-referrer" className="mt-3 aspect-[16/10] w-full rounded-md border border-white/10 sm:aspect-[16/7]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
