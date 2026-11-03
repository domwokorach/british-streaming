"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Navbar } from "@/components/layout/navbar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/auth/client";
import { useAuth } from "@/providers/auth-provider";

interface SessionRow { id: string; current: boolean; userAgent: string | null; ip: string | null; createdAt: string; lastUsedAt: string }

const describe = (ua: string | null) => (ua ? ua.replace(/\(.*?\)/g, "").slice(0, 60) || "Unknown device" : "Unknown device");

export default function SettingsPage() {
  const { signOut } = useAuth();
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);

  const load = useCallback(async () => {
    const res = await api<{ sessions: SessionRow[] }>("/api/auth/sessions");
    setSessions(res.ok ? res.data.sessions : []);
  }, []);
  useEffect(() => { queueMicrotask(load); }, [load]);

  async function revoke(id: string) {
    const res = await api(`/api/auth/sessions/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Session signed out"); load(); } else toast.error("Couldn't sign that session out", { description: res.error.message });
  }
  async function signOutAll() {
    const res = await api("/api/auth/sign-out-all", { method: "POST", body: {} });
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- deliberate hard navigation
    if (res.ok) window.location.href = "/account/sign-in"; // full navigation: drop all in-memory per-user state
    else toast.error("Couldn't sign out everywhere", { description: res.error.message });
  }

  return (
    <main className="min-h-dvh bg-ws-bg pb-12 text-white">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 pt-28 sm:px-10">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Tabs defaultValue="devices" className="mt-8">
          <TabsList variant="line" aria-label="Account settings sections">
            <TabsTrigger value="devices">Devices</TabsTrigger>
            <TabsTrigger value="tips">Security tips</TabsTrigger>
          </TabsList>
          <TabsContent value="devices" className="mt-4">
        <h2 className="text-xl font-semibold">Active sessions</h2>
        <p className="mt-1 text-sm text-ws-text-2">Devices currently signed in to your account.</p>
        <ul className="mt-4 space-y-3">
          {(sessions ?? []).map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 rounded-md border border-white/10 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{describe(s.userAgent)} {s.current && <span className="ml-2 rounded bg-ws-blue px-2 py-0.5 text-xs">This device</span>}</p>
                <p className="text-xs text-ws-text-2">Last active {new Date(s.lastUsedAt).toLocaleString()}{s.ip && s.ip !== "unknown" ? ` · ${s.ip}` : ""}</p>
              </div>
              {!s.current && <Button variant="outline" size="sm" onClick={() => revoke(s.id)} className="shrink-0 border-white/20 text-white hover:bg-white/10">Sign out</Button>}
            </li>
          ))}
          {sessions?.length === 0 && <li className="text-ws-text-2">No active sessions.</li>}
        </ul>
          </TabsContent>
          <TabsContent value="tips" className="mt-4">
            <Accordion multiple={false} className="rounded-md border border-white/10 px-4">
              <AccordionItem value="devices"><AccordionTrigger>Why review signed-in devices?</AccordionTrigger><AccordionContent>If you see a device you don&apos;t recognise, sign it out here and change your password. Signing out a device ends its session immediately.</AccordionContent></AccordionItem>
              <AccordionItem value="reset"><AccordionTrigger>What happens when I reset my password?</AccordionTrigger><AccordionContent>Every device is signed out at once, and you&apos;ll get an email confirming the change.</AccordionContent></AccordionItem>
              <AccordionItem value="remember"><AccordionTrigger>What does “Remember me” do?</AccordionTrigger><AccordionContent>It keeps this browser signed in for up to 30 days. Without it, you stay signed in until the browser session ends or the session expires from inactivity.</AccordionContent></AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={signOutAll} className="bg-ws-blue text-white hover:bg-[#6d2fd6]">Sign out of all devices</Button>
          <Button onClick={() => signOut()} variant="outline" className="border-white/20 text-white hover:bg-white/10">Sign out</Button>
        </div>
      </div>
    </main>
  );
}
