import type { Metadata } from "next";
import { RegisterForm } from "@/components/account/register-form";

export const metadata: Metadata = { title: "Create Account — WorldStreaming" };

export default function RegisterPage() {
  return <RegisterForm />;
}
