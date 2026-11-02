import { notFound } from "next/navigation";
import { ScrollLab } from "@/components/motion/scroll-lab";

// Evaluated per request: a static render would freeze the production on/off switch at build time.
export const dynamic = "force-dynamic";

export const metadata = { title: "Scroll animation lab", robots: { index: false, follow: false } };

/** Developer preview panel: always on in development; in production only when ANIMATION_LAB_ENABLED=true. */
export default function ScrollLabPage() {
  if (process.env.NODE_ENV === "production" && process.env.ANIMATION_LAB_ENABLED !== "true") notFound();
  return <ScrollLab />;
}
