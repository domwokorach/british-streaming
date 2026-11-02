// Pure error-budget maths shared by the rule generator, deploy gate, reports and tests.
import { readFileSync } from "node:fs";

export const loadSlos = (path = new URL("../../slo/slos.json", import.meta.url)) => JSON.parse(readFileSync(path, "utf8"));

/** Fraction of requests allowed to fail, e.g. 99.9 -> 0.001. */
export const errorBudgetRatio = (objectivePct) => (100 - objectivePct) / 100;

/** Minutes of full downtime a time-based SLO allows per window (99.9% / 30d = 43.2). */
export const budgetMinutes = (objectivePct, windowDays = 30) => +(windowDays * 24 * 60 * errorBudgetRatio(objectivePct)).toFixed(4);

/** Burn rate 1 spends exactly the whole budget over the window. */
export const burnRate = (observedErrorRatio, objectivePct) => observedErrorRatio / errorBudgetRatio(objectivePct);

/** Percentage of budget left given the error ratio observed across the full window (can go negative). */
export const budgetRemainingPct = (observedErrorRatio, objectivePct) => (1 - burnRate(observedErrorRatio, objectivePct)) * 100;

/** Hours until the budget is gone if the current burn rate continues; Infinity when not burning. */
export const hoursToExhaustion = (remainingPct, currentBurnRate, windowDays = 30) =>
  currentBurnRate <= 0 ? Infinity : (Math.max(remainingPct, 0) / 100 * windowDays * 24) / currentBurnRate;

/** Maps budget remaining to a deployment mode using the thresholds in slos.json. */
export function deploymentMode(remainingPct, policy) {
  if (remainingPct < policy.freezeBelowBudgetRemainingPct) return "frozen";
  if (remainingPct < policy.restrictBelowBudgetRemainingPct) return "restricted";
  if (remainingPct < policy.warnBelowBudgetRemainingPct) return "warn";
  return "open";
}

/** Instant query against Prometheus; returns a number or null when there is no data. */
export async function promQuery(baseUrl, query, token) {
  const res = await fetch(`${baseUrl}/api/v1/query?query=${encodeURIComponent(query)}`, { headers: token ? { authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new Error(`Prometheus query failed: ${res.status}`);
  const body = await res.json();
  const v = body.data?.result?.[0]?.value?.[1];
  return v === undefined || v === "NaN" ? null : Number(v);
}
