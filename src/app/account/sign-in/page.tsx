import type { Metadata } from "next";
import { SignInForm } from "@/components/account/sign-in-form";

export const metadata: Metadata = { title: "Sign In — WorldStreaming" };

export default async function SignInPage({ searchParams }: PageProps<"/account/sign-in">) {
  const { next, notice } = await searchParams;
  return <SignInForm next={typeof next === "string" ? next : undefined} notice={typeof notice === "string" ? notice : undefined} />;
}
