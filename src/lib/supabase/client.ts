"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

/** A single shared browser client per tab, so auth state and Realtime sockets aren't duplicated across every hook that needs one. */
export function createSupabaseBrowserClient() {
  if (browserClient) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || url.includes("YOUR_") || key.includes("YOUR_")) throw new Error("Supabase public credentials are not configured.");
  browserClient = createClient(url, key);
  return browserClient;
}
