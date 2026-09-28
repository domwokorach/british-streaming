"use client";

import { useMediaQuery } from "@/hooks/use-media-query";

/** True only on devices that can actually hover with a pointer (mouse/trackpad) — never touch. */
export function useHasHover() {
  return useMediaQuery("(hover: hover) and (pointer: fine)");
}
