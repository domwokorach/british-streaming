import type { Metadata } from "next";

import { ErrorScreen } from "@/components/errors/error-screen";

export const metadata: Metadata = { title: "404 — Page Not Found | British Streaming" };

export default function NotFound() {
  return <ErrorScreen variant="404" />;
}
