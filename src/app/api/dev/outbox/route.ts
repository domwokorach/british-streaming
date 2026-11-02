import { unsafeTestMode } from "@/lib/auth/jwt-env";
import { getStore, isMemoryStore } from "@/lib/auth/store";

// Test-only inbox for the in-memory store. Hard 404 anywhere else.
const store = () => {
  if (process.env.NODE_ENV === "production" && !unsafeTestMode()) return null;
  const s = getStore();
  return isMemoryStore(s) ? s : null;
};

export function GET(request: Request) {
  const s = store();
  if (!s) return new Response(null, { status: 404 });
  const to = new URL(request.url).searchParams.get("to");
  const messages = s.outbox.filter((m) => !to || m.to === to);
  return Response.json({ messages, audit: new URL(request.url).searchParams.get("audit") ? s.auditLog : undefined });
}

export function DELETE() {
  const s = store();
  if (!s) return new Response(null, { status: 404 });
  s.outbox.length = 0;
  return new Response(null, { status: 204 });
}
