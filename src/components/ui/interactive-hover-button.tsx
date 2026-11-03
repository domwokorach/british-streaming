import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"

// Adapted from the Magic UI source: native button attributes are forwarded, the duplicated hover label is
// aria-hidden, hover/touch/reduced-motion/disabled states are handled, and a link variant is added.
const base =
  "group relative flex min-h-12 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-ws-blue bg-ws-blue px-[5px] py-[5px] sm:px-[6px] md:px-[8px] lg:px-[10px] xl:px-[12px] text-center text-base font-semibold text-white outline-none transition-transform duration-150 select-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70 motion-reduce:transition-none motion-reduce:active:scale-100"

function Content({ children }: { children: React.ReactNode }) {
  return (
    <>
      <span className="inline-flex items-center justify-center gap-2 transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:opacity-100">
        {children}
      </span>
      {/* Hover layer: a dark fill grows from the centre while a copy of the label slides in with an arrow. */}
      <span aria-hidden className="pointer-events-none absolute inset-0 -z-0 flex items-center justify-center">
        <span className="size-2 rounded-full bg-ws-bg transition-transform duration-300 group-hover:scale-[100] motion-reduce:hidden" />
      </span>
      <span aria-hidden className="pointer-events-none absolute inset-0 z-10 flex translate-x-12 items-center justify-center gap-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:hidden">
        {children}
        <ArrowRight className="size-5" />
      </span>
    </>
  )
}

export function InteractiveHoverButton({ children, className, ...props }: React.ComponentProps<"button">) {
  return (
    <button className={cn(base, className)} {...props}>
      <Content>{children}</Content>
    </button>
  )
}

export function InteractiveHoverLink({ children, className, ...props }: React.ComponentProps<typeof Link>) {
  return (
    <Link className={cn(base, className)} {...props}>
      <Content>{children}</Content>
    </Link>
  )
}
