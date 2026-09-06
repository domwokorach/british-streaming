import { AuthForm } from "@/components/account/auth-form";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#141414] px-4">
      <AuthForm mode="sign-up" />
    </main>
  );
}
