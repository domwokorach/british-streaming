"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, refreshSession } from "@/lib/auth/client";

export interface AuthUser { id: string; fullName: string; email: string; emailVerified: boolean; role: "user" | "admin" }

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  /** Re-reads the session from the server (call after sign-in). */
  refreshUser: () => Promise<AuthUser | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
// Refresh comfortably inside the default 15-minute access token lifetime.
const PROACTIVE_REFRESH_MS = 10 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const res = await api<{ user: AuthUser }>("/api/auth/me"); // api() transparently refreshes an expired access token
    const next = res.ok ? res.data.user : null;
    setUser(next);
    setLoading(false);
    return next;
  }, []);

  useEffect(() => {
    queueMicrotask(() => void refreshUser());
  }, [refreshUser]);

  // Keep the session warm while signed in, and re-validate when the tab returns (e.g. revoked elsewhere).
  useEffect(() => {
    if (!user) return;
    const timer = setInterval(async () => {
      if (document.visibilityState === "visible" && !(await refreshSession())) setUser(null);
    }, PROACTIVE_REFRESH_MS);
    const onVisible = () => { if (document.visibilityState === "visible") void refreshUser(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [user, refreshUser]);

  const signOut = useCallback(async () => {
    await api("/api/auth/sign-out", { method: "POST", body: {} });
    setUser(null);
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- deliberate hard navigation
    window.location.href = "/account/sign-in"; // deliberate full navigation: clears all in-memory per-user state
  }, []);

  return <AuthContext.Provider value={{ user, loading, refreshUser, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
