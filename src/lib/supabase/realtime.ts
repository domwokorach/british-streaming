"use client";

import { useEffect } from "react";
import { createSupabaseBrowserClient } from "./client";

export function useUserStateRealtime(userId: string | null, onChange: () => void) {
  useEffect(() => {
    if (!userId) return;
    let supabase;
    try { supabase = createSupabaseBrowserClient(); } catch { return; }
    const channel = supabase.channel(`user-state:${userId}`).on("postgres_changes", { event: "*", schema: "public", table: "my_list", filter: `user_id=eq.${userId}` }, onChange).on("postgres_changes", { event: "*", schema: "public", table: "watch_progress", filter: `user_id=eq.${userId}` }, onChange).on("postgres_changes", { event: "*", schema: "public", table: "reactions", filter: `user_id=eq.${userId}` }, onChange).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId, onChange]);
}
