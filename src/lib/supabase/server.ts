import "server-only";

import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || url.includes("YOUR_")) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  return createClient(url, env.supabaseSecretKey, { auth: { autoRefreshToken: false, persistSession: false } });
}
