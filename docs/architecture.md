# Architecture & assumptions

## Assumptions (change these and the Terraform modules follow)
- **Cloud:** AWS, region `eu-west-2`. **Compute:** ECS on Fargate behind an ALB (Kubernetes is not justified yet; the image is Kubernetes-ready: stateless, non-root, `/api/health` liveness, `/api/ready` readiness, SIGTERM-aware via tini).
- **Data:** the app's system of record is **Supabase** (managed Postgres + auth + realtime) and content comes from **TMDB**. Terraform therefore provisions no database by default; `modules/database` (RDS) exists behind `enable_database`.
- **Registry:** ECR with immutable tags and scan-on-push. Deploys reference images by digest.
- **CI/CD:** GitHub Actions with OIDC to AWS (no stored keys). **Metrics:** Prometheus/Grafana/Loki/Alertmanager/OTel Collector; run them as a separate stack (compose for local; managed Grafana/AMP or a small ECS service in a shared account for real environments).
- The app previously targeted Vercel. Nothing here prevents that; the `/api/*` instrumentation is host-agnostic.

## Flow
```
PR → CI (lint, types, tests, gitleaks, audit, tf fmt/validate/trivy, docker build+scan+smoke)
main → build image → push ECR (digest) → dev → staging → [approval] production
        each: error-budget gate (prod) → terraform apply → ECS stable → smoke → burn-rate check → auto-rollback on failure
runtime: browser → ALB(TLS1.3, ACM) → ECS tasks (private subnets) → TMDB / Supabase
telemetry: /api/metrics → Prometheus → rules (slo.rules.yml) → Alertmanager → on-call; logs (JSON) → Loki; traces → OTel Collector
```

## Reliability model
`slo/slos.json` is the single source of truth. `npm run slo:rules` generates Prometheus recording and multi-window burn-rate rules; CI fails if the committed rules are stale. Defaults: availability 99.9% (43.2 min / 30 days), p95 < 300 ms, 5xx < 0.1%. SLA is 99.5% so internal alarms fire before contractual breach.

## What is and is not covered
| Area | Status |
|---|---|
| App metrics, health/ready, structured logs, request IDs, Web Vitals + player telemetry endpoints | Implemented and type-checked |
| SLO/error-budget maths, rule generation, deploy gate, reports | Implemented and unit-tested |
| Dockerfile, compose, Terraform, workflows | Written, **not executed** in the authoring environment (no Docker/Terraform available); CI validates them on first run |
| Host metrics (CPU/disk/network), DB pool metrics | Via CloudWatch/Container Insights (enabled); add cAdvisor/node-exporter if you self-host Prometheus on EC2 |
| Playwright E2E (4 device profiles), axe WCAG 2.2 AA, API contract tests, breakpoint overflow checks | `npm run build && npm run test:e2e` (96 tests; hero tests skip without a TMDB token); runs in the CI `e2e` job |
| Distributed tracing instrumentation in the app | Collector configured; the app does not yet emit OTLP spans (add `@vercel/otel` or `@opentelemetry/sdk-node` in `instrumentation.ts`) |
| Video QoE (buffering) | `/api/telemetry` accepts `start/buffer/error`; the player doesn't emit them yet because playback is YouTube trailers |
