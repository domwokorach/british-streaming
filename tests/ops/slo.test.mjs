import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { render } from "../../scripts/slo/generate-rules.mjs";
import { budgetMinutes, budgetRemainingPct, burnRate, deploymentMode, hoursToExhaustion, loadSlos } from "../../scripts/slo/lib.mjs";

const config = loadSlos();

test("99.9% over 30 days is a 43.2 minute budget", () => assert.equal(budgetMinutes(99.9, 30), 43.2));
test("burn rate 1 consumes exactly the budget", () => {
  assert.equal(+burnRate(0.001, 99.9).toFixed(6), 1);
  assert.equal(Math.round(budgetRemainingPct(0.0005, 99.9)), 50);
  assert.ok(budgetRemainingPct(0.002, 99.9) < 0);
});
test("14.4x burn exhausts a 30d budget in ~50 hours", () => assert.equal(Math.round(hoursToExhaustion(100, 14.4)), 50));
test("deployment policy thresholds", () => {
  const p = config.deploymentPolicy;
  assert.equal(deploymentMode(80, p), "open");
  assert.equal(deploymentMode(40, p), "warn");
  assert.equal(deploymentMode(10, p), "restricted");
  assert.equal(deploymentMode(-1, p), "frozen");
});
test("committed Prometheus rules match the SLO config", () => {
  assert.equal(readFileSync("monitoring/prometheus/rules/slo.rules.yml", "utf8"), render(config));
});
test("every SLO has the four multi-window burn alerts and a runbook", () => {
  const rules = render(config);
  for (const slo of config.slos) for (const a of config.burnRateAlerts) assert.match(rules, new RegExp(`alert: ErrorBudgetBurn_${slo.name}_${a.long}\\b`));
  assert.ok(existsSync("docs/runbooks/error-budget-burn.md"));
});
test("latency threshold is a real histogram bucket edge", () => {
  const src = readFileSync("src/lib/observability/metrics.ts", "utf8");
  assert.match(src, /LATENCY_BUCKETS = \[[^\]]*\b0\.3\b/);
});
