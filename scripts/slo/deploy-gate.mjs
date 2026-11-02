#!/usr/bin/env node
// Reliability-based deployment policy. Exit 0 = may deploy, 1 = blocked.
// Usage: PROMETHEUS_URL=... node scripts/slo/deploy-gate.mjs --change-type feature
import { deploymentMode, loadSlos, promQuery } from "./lib.mjs";

const arg = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i > -1 ? process.argv[i + 1] : fallback; };
const changeType = arg("change-type", "feature");
const url = process.env.PROMETHEUS_URL;
const { slos, deploymentPolicy: policy, burnRateAlerts } = loadSlos();

// --post-deploy: fail if the short-window burn rate is at the paging threshold, so the workflow rolls back.
if (process.argv.includes("--post-deploy")) {
  if (!url) process.exit(0);
  const page = burnRateAlerts.find((a) => a.severity === "page");
  for (const slo of slos) {
    const ratio = await promQuery(url, `slo:${slo.name}:error_ratio_rate5m`, process.env.PROMETHEUS_TOKEN);
    const burn = ratio === null ? 0 : ratio / ((100 - slo.objective) / 100);
    console.log(`${slo.name}: 5m burn rate ${burn.toFixed(2)}x (limit ${page.burnRate}x)`);
    if (burn >= page.burnRate) { console.error(`Post-deploy regression on ${slo.name}`); process.exit(1); }
  }
  process.exit(0);
}

if (!url) { console.log("PROMETHEUS_URL not set; skipping reliability gate (non-production)."); process.exit(0); }

let worst = Infinity;
for (const slo of slos) {
  const ratio = await promQuery(url, `slo:${slo.name}:error_budget_remaining_ratio`, process.env.PROMETHEUS_TOKEN);
  if (ratio === null) { console.warn(`No data for ${slo.name}; treating as healthy`); continue; }
  console.log(`${slo.name}: ${(ratio * 100).toFixed(1)}% budget remaining`);
  worst = Math.min(worst, ratio * 100);
}
const mode = deploymentMode(worst, policy);
console.log(`Deployment mode: ${mode} (worst budget remaining ${Number.isFinite(worst) ? worst.toFixed(1) : "n/a"}%)`);
const allowed = mode === "open" || mode === "warn" || (mode === "restricted" && policy.restrictedAllows.includes(changeType)) || (mode === "frozen" && changeType === "rollback");
if (!allowed) { console.error(`BLOCKED: '${changeType}' deploys are not allowed while mode is '${mode}'. See docs/runbooks/error-budget-burn.md`); process.exit(1); }
