import "server-only";

import { authConfig } from "../config";
import { MemoryAuthStore } from "./memory";
import { SupabaseAuthStore } from "./supabase";
import type { AuthStore } from "./types";

const g = globalThis as unknown as { __wsAuthStore?: AuthStore };

/** One store per process (shared across route bundles in dev via globalThis). */
export function getStore(): AuthStore {
  g.__wsAuthStore ??= authConfig.storeKind === "memory" ? new MemoryAuthStore() : new SupabaseAuthStore();
  return g.__wsAuthStore;
}

export const isMemoryStore = (s: AuthStore): s is MemoryAuthStore => s instanceof MemoryAuthStore;
