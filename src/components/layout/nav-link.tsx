"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { requestNavScroll, scrollToNavTarget } from "@/lib/nav-scroll";
import { targetIdFor } from "@/lib/nav-targets";

/**
 * A primary-navigation link. Going to another page arms a one-shot "scroll to content" request that the destination
 * honours once its content is mounted (see NavScrollHandler). Clicking the link of the page you are already on
 * scrolls to that page's content in place, with no reload.
 */
export function NavLink({ href, onClick, ...props }: React.ComponentProps<typeof Link>) {
  const pathname = usePathname();
  const target = typeof href === "string" ? href : href.pathname ?? "";
  return (
    <Link
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        if (!targetIdFor(target)) return;
        if (pathname === target) {
          const el = document.getElementById(targetIdFor(target)!);
          if (el) { event.preventDefault(); scrollToNavTarget(el); }
          return;
        }
        requestNavScroll();
      }}
      {...props}
    />
  );
}
