import { notFound } from "next/navigation";
import slos from "../../../slo/slos.json";
import { budgetMinutes, budgetRemainingPct, deploymentMode } from "../../../scripts/slo/lib.mjs";
import { cn } from "cn";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ops — WorldStreaming", robots: { index: false, follow: false } };

type Reading = { name: string; objective: number; sli: number | null; remaining: number | null };

async function prom(query: string): Promise<number | null> {
  const base = process.env.PROMETHEUS_URL;
  if (!base) return null;
  try {
    const res = await fetch(`${base}/api/v1/query?query=${encodeURIComponent(query)}`, {
      headers: process.env.PROMETHEUS_TOKEN ? { authorization: `Bearer ${process.env.PROMETHEUS_TOKEN}` } : {},
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    const v = (await res.json()).data?.result?.[0]?.value?.[1];
    return v === undefined || v === "NaN" ? null : Number(v);
  } catch {
    return null;
  }
}

const SAMPLE = [
  { label: "Terraform", rows: [["dev", "in sync"], ["staging", "in sync"], ["prod", "in sync"]] },
  { label: "Containers", rows: [["web ×3", "healthy"], ["restarts (24h)", "0"], ["memory", "61% of limit"]] },
  { label: "CI/CD", rows: [["main", "passing"], ["last deploy", "prod · 2h ago"], ["rollbacks (30d)", "0"]] },
  { label: "Security", rows: [["image scan", "0 critical"], ["npm audit", "0 high"], ["CodeQL", "clean"]] },
  { label: "Cost (month to date)", rows: [["dev", "$41"], ["staging", "$88"], ["prod", "$402"]] },
];

/** Operational overview. Gated: returns 404 unless OPS_DASHBOARD_ENABLED=true (and put it behind auth/VPN when enabled). */
export default async function OpsPage() {
  if (process.env.OPS_DASHBOARD_ENABLED !== "true") notFound();
  const live = Boolean(process.env.PROMETHEUS_URL);
  const readings: Reading[] = await Promise.all(
    slos.slos.map(async (slo): Promise<Reading> => {
      const [err, remaining] = await Promise.all([
        prom(`slo:${slo.name}:error_ratio_rate${slos.windowDays}d`),
        prom(`slo:${slo.name}:error_budget_remaining_ratio`),
      ]);
      return { name: slo.name, objective: slo.objective, sli: err === null ? null : (1 - err) * 100, remaining: remaining === null ? (err === null ? null : budgetRemainingPct(err, slo.objective)) : remaining * 100 };
    }),
  );
  const known = readings.map((r) => r.remaining).filter((v): v is number => v !== null);
  const mode = known.length ? deploymentMode(Math.min(...known), slos.deploymentPolicy) : null;

  return (
    <main className="min-h-screen bg-[#0d1b3e] px-4 py-6 text-white sm:px-8">
      <header className="mx-auto mb-6 flex max-w-6xl flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Reliability &amp; Operations</h1>
          <p className="text-sm text-zinc-400">{slos.service} · {slos.windowDays}-day window · full-outage budget at 99.9% = {budgetMinutes(99.9, slos.windowDays)} min</p>
        </div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider", live ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300")}>
          {live ? "Live · Prometheus" : "No Prometheus configured"}
        </span>
      </header>

      <section aria-label="Service level objectives" className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {readings.map((r) => {
          const pct = r.remaining === null ? null : Math.max(0, Math.min(100, r.remaining));
          return (
            <article key={r.name} className="rounded-xl border border-white/10 bg-[#16275a] p-5">
              <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-400">{r.name.replace("_", " ")}</h2>
              <p className="mt-2 text-3xl font-bold tabular-nums">{r.sli === null ? "—" : `${r.sli.toFixed(3)}%`}</p>
              <p className="text-xs text-zinc-400">objective {r.objective}%</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Error budget remaining" aria-valuenow={pct ?? 0} aria-valuemin={0} aria-valuemax={100}>
                <div className={cn("h-full rounded-full transition-[width] duration-700", (pct ?? 0) < 25 ? "bg-red-500" : (pct ?? 0) < 50 ? "bg-amber-400" : "bg-emerald-400")} style={{ width: `${pct ?? 0}%` }} />
              </div>
              <p className="mt-2 text-xs text-zinc-300">{pct === null ? "No data yet" : `${pct.toFixed(1)}% error budget remaining`}</p>
            </article>
          );
        })}
      </section>

      <p className="mx-auto mt-4 max-w-6xl text-sm text-zinc-300">
        Deployment mode: <strong className={cn(mode === "open" && "text-emerald-300", mode === "warn" && "text-amber-300", (mode === "restricted" || mode === "frozen") && "text-red-300")}>{mode ?? "unknown (no data)"}</strong>
      </p>

      <section aria-label="Platform status (sample data)" className="mx-auto mt-8 max-w-6xl">
        <h2 className="mb-1 text-lg font-semibold">Platform status</h2>
        <p className="mb-4 text-xs text-amber-300">Sample data — these panels need the AWS, GitHub and Cost Explorer integrations wired in before they show real values.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SAMPLE.map((panel) => (
            <article key={panel.label} className="rounded-xl border border-white/10 bg-[#16275a] p-5">
              <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-400">{panel.label}</h3>
              <dl className="space-y-2 text-sm">
                {panel.rows.map(([k, v]) => (<div key={k} className="flex justify-between gap-4"><dt className="text-zinc-300">{k}</dt><dd className="tabular-nums">{v}</dd></div>))}
              </dl>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
