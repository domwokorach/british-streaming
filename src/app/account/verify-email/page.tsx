import type { Metadata } from "next";
import { VerifyEmailPanel } from "@/components/account/verify-email-panel";

export const metadata: Metadata = { title: "Verify Email — WorldStreaming", referrer: "no-referrer", robots: { index: false, follow: false } };

export default async function VerifyEmailPage({ searchParams }: PageProps<"/account/verify-email">) {
  const { token, email, sent } = await searchParams;
  return <VerifyEmailPanel token={typeof token === "string" ? token : undefined} email={typeof email === "string" ? email : undefined} sent={sent === "1"} />;
}
