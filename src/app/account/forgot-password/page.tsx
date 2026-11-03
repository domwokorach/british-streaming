import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/account/forgot-password-form";

export const metadata: Metadata = { title: "Forgot Password | British Streaming" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
