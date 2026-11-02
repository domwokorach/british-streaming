#!/usr/bin/env node
// Weekly / monthly reliability report as Markdown. Usage: node scripts/slo/report.mjs --period weekly > report.md
import { budgetMinutes, loadSlos, promQuery } from "./lib.mjs";

const period = process.argv.includes("monthly") ? "monthly" : "weekly";
const range = period === "monthly" ? "30d" : "7d";
const url = process.env.PROMETHEUS_URL;
if (!url) { console.error("PROMETHEUS_URL is required"); process.exit(2); }
const { slos, service, windowDays } = loadSlos();

const rows = [];
for (const slo of slos) {
  const w = (e) => e.replaceAll("$WINDOW", range);
  const errRatio = await promQuery(url, `1 - (${w(slo.sli.good)}) / (${w(slo.sli.total)})`, process.env.PROMETHEUS_TOKEN);
  const remaining = await promQuery(url, `slo:${slo.name}:error_budget_remaining_ratio`, process.env.PROMETHEUS_TOKEN);
  const sli = errRatio === null ? null : (1 - errRatio) * 100;
  rows.push(`| ${slo.name} | ${slo.objective}% | ${sli === null ? "n/a" : sli.toFixed(3) + "%"} | ${sli === null ? "-" : sli >= slo.objective ? "met" : "MISSED"} | ${remaining === null ? "n/a" : (remaining * 100).toFixed(1) + "%"} |`);
}
console.log(`# ${service} ${period} reliability report\n\nGenerated ${new Date().toISOString()} · window ${range}\n\n| SLO | Objective | Achieved | Status | Budget left (${windowDays}d) |\n|---|---|---|---|---|\n${rows.join("\n")}\n\nFull-outage budget at 99.9%: ${budgetMinutes(99.9, windowDays)} min per ${windowDays} days.`);
