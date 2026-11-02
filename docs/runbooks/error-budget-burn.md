# Runbook: error-budget burn alert

**Alerts:** `ErrorBudgetBurn_<slo>_<window>` (generated from `slo/slos.json`).

| Severity | Meaning | Response |
|---|---|---|
| page (1h/5m, 6h/30m) | Budget will be gone in ~2 days or less at this rate | Acknowledge within 5 min, start an incident |
| ticket (1d/2h, 3d/6h) | Slow burn | Fix within the working week |

## First 10 minutes
1. Open Grafana → **SLO & Error Budget**; note which SLO and since when.
2. Open **Service Overview**: which `route` has the 5xx or latency spike? Was there a deploy at that time (`deploy.yml` run history)?
3. Query logs: `{service="worldstreaming-web"} | json | level="error"`; follow a `requestId` end to end.
4. Check dependencies: TMDB status (`/api/trending` 503s) and Supabase status.
5. **If a deploy preceded the burn, roll back first and investigate second** → [rollback.md](rollback.md).

## Deployment policy while budget is low
`scripts/slo/deploy-gate.mjs` enforces `deploymentPolicy` in `slo/slos.json`:
- < 50% remaining: warning in the job log.
- < 25%: only `hotfix`, `security`, `reliability`, `rollback` changes deploy to production.
- < 0%: freeze; rollbacks only. Unfreezing needs the budget back above 0 or an explicit documented exception from the service owner.

Dispatch a gated deploy with `change_type` set accordingly.
