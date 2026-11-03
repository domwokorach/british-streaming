"use client";

import { useEffect, useState } from "react";

import { ErrorScreen } from "@/components/errors/error-screen";

/** Unexpected failures inside a route. Never rendered for missing pages (see `not-found.tsx`), and never shows the error message. */
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  // Read connectivity after mount so the server and first client render agree.
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    console.error(error);
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => { window.removeEventListener("online", sync); window.removeEventListener("offline", sync); };
  }, [error]);

  return <ErrorScreen variant={offline ? "offline" : "500"} onRetry={retry} reference={error.digest} />;
}
