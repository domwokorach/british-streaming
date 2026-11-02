import { redirect } from "next/navigation";

// `/browse` is a members-only entry point (guarded in proxy.ts); the catalogue itself lives on the home page.
export default function BrowsePage() {
  redirect("/");
}
