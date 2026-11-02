# Runbook: roll back production

Automatic: ECS deployment circuit breaker rolls back tasks that fail health checks, and `_deploy-env.yml` re-applies the previous image if smoke tests or the post-deploy burn-rate check fail.

Manual (target: under 10 minutes):
1. Find the last good digest: GitHub → Actions → previous successful **Deploy** run summary (`image:` line), or `aws ecs describe-task-definition` on an older revision.
2. Actions → **Deploy** → *Run workflow* → `image_digest = sha256:<good>`, `change_type = rollback`. This skips the build and goes dev → staging → production (approve the production gate).
3. Watch `scripts/ci/smoke-url.sh` pass and the burn rate fall in Grafana.
4. Open an incident review issue. Revert or fix the offending commit on `main` via PR.

Emergency, if CI is unavailable:
```bash
aws ecs update-service --cluster worldstreaming-prod --service worldstreaming-prod \
  --task-definition worldstreaming-prod:<previous-revision> --force-new-deployment
```
Then reconcile Terraform state by re-running Deploy with the same digest, otherwise the next apply will revert it.

**Database migrations** (`supabase/migrations`) are not rolled back with the app. Write migrations expand/contract: ship additive changes first, remove old columns in a later release.
