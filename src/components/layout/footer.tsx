"use client";

import { Accessibility, FileText, Phone, Shield } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";
import { BRAND } from "@/lib/brand";

const linkClass = "group/link inline-flex min-h-8 items-center gap-2 rounded-sm py-1 text-ws-text transition-colors duration-200 hover:text-ws-lavender focus-visible:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ws-lavender motion-reduce:transition-none";
const underline = "underline-offset-4 decoration-ws-blue group-hover/link:underline group-focus-visible/link:underline";

/** Entries without a destination yet stay plain text rather than linking to a page that doesn't exist. */
const INFO = ["Audio and Subtitles", "Media Centre", "Contact Us"];

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5 }}
      className="mx-4 border-t border-white/10 bg-transparent px-0 py-8 text-sm text-ws-text sm:mx-10"
    >
      <p className="mb-5 flex items-center gap-2 text-xs"><Phone className="size-4 shrink-0 text-ws-lavender" aria-hidden />Questions? Call 0800 096 6379</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3 lg:grid-cols-4">
        {INFO.map((label) => <span key={label} className="py-1 text-xs">{label}</span>)}
        <nav aria-label="Legal and accessibility" className="contents">
          <Link href="/privacy" className={`${linkClass} text-xs`}><Shield className="size-4 shrink-0" aria-hidden /><span className={underline}>Privacy</span></Link>
          <Link href="/legal/terms-and-conditions" className={`${linkClass} text-xs`}><FileText className="size-4 shrink-0" aria-hidden /><span className={underline}>Terms &amp; Conditions</span></Link>
          <Link href="/accessibility" className={`${linkClass} text-xs`}><Accessibility className="size-4 shrink-0" aria-hidden /><span className={underline}>Accessibility</span></Link>
        </nav>
      </div>
      <p className="mt-6 text-xs text-ws-text-2">&copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
    </motion.footer>
  );
}
