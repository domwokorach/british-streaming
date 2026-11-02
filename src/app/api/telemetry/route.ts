import { playerEvents, playerStartup, webVitals } from "@/lib/observability/metrics";

const VITALS = new Set(["LCP", "INP", "CLS", "FCP", "TTFB"]);
const PLAYER = new Set(["start", "buffer", "error"]);

/**
 * Receives Core Web Vitals and playback events from browsers. Names are checked
 * against allow-lists so clients cannot create unbounded metric label values.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { type?: string; name?: string; value?: number } | null;
  if (!body || typeof body.name !== "string" || typeof body.value !== "number" || !Number.isFinite(body.value)) return new Response(null, { status: 400 });
  if (body.type === "vital" && VITALS.has(body.name)) webVitals.observe({ name: body.name }, body.value);
  else if (body.type === "player" && PLAYER.has(body.name)) {
    playerEvents.inc({ event: body.name });
    if (body.name === "start") playerStartup.observe({}, body.value);
  } else return new Response(null, { status: 400 });
  return new Response(null, { status: 204 });
}
