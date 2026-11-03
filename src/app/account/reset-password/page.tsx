import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/account/reset-password-form";

// The URL carries a one-time secret: never leak it through the Referer header or search indexes.
export const metadata: Metadata = { title: "Reset Password | British Streaming", referrer: "no-referrer", robots: { index: false, follow: false } };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/account/reset-password">) {
  const { token } = await searchParams;
  return <ResetPasswordForm token={typeof token === "string" ? token : undefined} />;
}
