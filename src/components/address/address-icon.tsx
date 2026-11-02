"use client";

import { MapPin } from "lucide-react";
import { motion } from "motion/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "cn";

/** Scales with the viewport: 16px on phones, 20px from the sm breakpoint up. */
const sizeClass = "size-4 sm:size-5";

/** Decorative pin. Pass `active` to lift it (e.g. while its field has focus). */
export function AddressIcon({ active = false, className }: { active?: boolean; className?: string }) {
  return (
    <motion.span aria-hidden animate={active ? { y: -2, scale: 1.12 } : { y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 420, damping: 22 }} className="inline-flex">
      <MapPin className={cn(sizeClass, "transition-colors duration-150", active ? "text-[#a78bfa]" : "text-zinc-400", className)} />
    </motion.span>
  );
}

interface AddressIconButtonProps {
  /** Doubles as the tooltip text and the accessible name. */
  label: string;
  icon?: React.ReactNode;
  /** When set the control renders as an external link instead of a button. */
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  "aria-expanded"?: boolean;
  className?: string;
}

const buttonClass = "inline-flex size-10 shrink-0 items-center justify-center rounded-full text-zinc-200 outline-none transition-colors hover:bg-white/10 hover:text-[#a78bfa] focus-visible:ring-2 focus-visible:ring-[#a78bfa] disabled:pointer-events-none disabled:opacity-50";

/** Icon-only action with hover/tap motion, a tooltip and a 40px touch target. */
export function AddressIconButton({ label, icon, href, className, onClick, disabled, "aria-expanded": expanded }: AddressIconButtonProps) {
  const motionProps = { whileHover: { scale: 1.08 }, whileTap: { scale: 0.92 }, "aria-label": label, className: cn(buttonClass, className) };
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          href ? (
            <motion.a href={href} target="_blank" rel="noopener noreferrer" {...motionProps} />
          ) : (
            <motion.button type="button" onClick={onClick} disabled={disabled} aria-expanded={expanded} {...motionProps} />
          )
        }
      >
        {icon ?? <MapPin className={sizeClass} aria-hidden />}
      </TooltipTrigger>
      <TooltipContent className="border-white/10 bg-[#16275a] text-white">{label}</TooltipContent>
    </Tooltip>
  );
}
