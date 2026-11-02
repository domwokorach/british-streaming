import { redirect } from "next/navigation";

// Legacy URL kept so old links and bookmarks keep working.
export default function LegacySignUpPage() {
  redirect("/account/register");
}
