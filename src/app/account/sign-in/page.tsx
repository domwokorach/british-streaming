import type { Metadata } from "next";
import { SignInForm } from "@/components/account/sign-in-form";

export const metadata: Metadata = { title: "Sign In | British Streaming", description: "Sign in to British Streaming to watch films and series." };

export default async function SignInPage({ searchParams }: PageProps<"/account/sign-in">) {
  const { next, notice } = await searchParams;
  return <SignInForm next={typeof next === "string" ? next : undefined} notice={typeof notice === "string" ? notice : undefined} />;
}
