import { permanentRedirect } from "next/navigation";

/** Legacy URL (still linked from registration): the terms now live under /legal. */
export default function Page() {
  permanentRedirect("/legal/terms-and-conditions");
}
