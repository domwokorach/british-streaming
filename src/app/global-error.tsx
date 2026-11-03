"use client";

import { useEffect } from "react";
import { Figtree } from "next/font/google";

import "./globals.css";
import { ErrorScreen } from "@/components/errors/error-screen";

const brandSans = Figtree({ variable: "--font-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

/** Last resort: replaces the root layout, so it owns <html>/<body>, fonts and global styles. */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <html lang="en" className={`dark ${brandSans.variable} h-full antialiased`}>
      <head><title>Server Error | British Streaming</title></head>
      <body className="min-h-full bg-ws-bg">
        <ErrorScreen variant="500" onRetry={retry} reference={error.digest} documentLevel />
      </body>
    </html>
  );
}
