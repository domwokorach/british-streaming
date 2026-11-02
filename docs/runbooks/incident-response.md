# Runbook: incident response

## Severities
- **SEV1** – streaming or sign-in down for most users, or data exposure. Page immediately.
- **SEV2** – major feature degraded (search, playback errors > 5%, a region down).
- **SEV3** – minor degradation, workaround exists.

## Roles
Incident commander (decides, owns comms), operations lead (hands on keyboard), scribe (timeline). One person may hold several roles in a small team; the commander is never the person debugging.

## Escalation
Page on-call (Alertmanager `oncall` receiver) → if no ack in 15 min page secondary → if SEV1 and no progress in 30 min page the service owner.

## Flow
1. Declare: open an issue titled `INCIDENT: <summary>` with severity, start time, commander.
2. Stabilise before diagnosing: roll back ([rollback.md](rollback.md)), scale out (`max_tasks`), or fail dependency features closed.
3. Communicate every 30 min (SEV1) / 60 min (SEV2).
4. Resolve: confirm SLIs recover for 30 minutes.
5. Within 5 working days: blameless review with timeline, root cause, error-budget minutes spent, and follow-up issues labelled `reliability`.

## Security incidents
Rotate affected secrets in Secrets Manager (`aws secretsmanager put-secret-value`), force a new ECS deployment, review CloudTrail, and notify the owner. Never paste secret values in tickets.
