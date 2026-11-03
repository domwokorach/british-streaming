"use client";

import { ArrowUp } from "lucide-react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";
import { useMotionTier } from "@/hooks/use-motion-profile";

/** Appears after the user has scrolled a screen or so; sits above the phone tab bar. */
export function ScrollToTop({ showAfter = 640 }: { showAfter?: number }) {
  const [visible, setVisible] = useState(false);
  const tier = useMotionTier();
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setVisible((current) => (current === y > showAfter ? current : y > showAfter)));
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          aria-label="Scroll to top"
          initial={{ opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.9 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={{ duration: 0.2 }}
          onClick={() => window.scrollTo({ top: 0, behavior: tier === "none" ? "auto" : "smooth" })}
          className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 flex size-11 items-center justify-center rounded-full bg-ws-blue text-white shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-white md:right-6 md:bottom-6"
        >
          <ArrowUp className="size-5" aria-hidden />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
