"use client";

import { useEffect, useRef } from "react";
import { refreshSession } from "@/lib/auth/client";
import { safeNext } from "@/lib/auth/safe-redirect";
import { Spinner } from "@/components/ui/spinner";

/** Landing spot when the proxy sees an expired access token but a refresh cookie: renew silently, then continue. */
export function SessionRefresh({ next }: { next?: string }) {
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const dest = safeNext(next);
    // Hard navigation on purpose: right after the tokens rotate, a soft router.replace() can fetch the page's data
    // yet never commit (observed ~1 in 10 runs). A full load always sends the fresh cookies and is rarely hit.
    void refreshSession().then((ok) => {
      window.location.replace(ok ? dest : `/account/sign-in?notice=expired&next=${encodeURIComponent(dest)}`);
    });
  }, [next]);
  return <main className="flex min-h-dvh items-center justify-center bg-ws-bg"><Spinner className="size-8 text-ws-lavender" /></main>;
}
