# Runbook: disaster recovery

Targets: **RTO 1 hour, RPO 15 minutes** for user data (Supabase point-in-time recovery). The web tier is stateless and rebuilt from code.

| Failure | Recovery |
|---|---|
| Bad release | [rollback.md](rollback.md) |
| AZ loss | Automatic: ≥2 AZs, ALB health checks, ECS replaces tasks. Prod uses a NAT per AZ |
| Region loss | `terraform apply` the `prod` root with `region` changed (new state key), re-point DNS. Image must exist in the new region's ECR (enable ECR replication) |
| Terraform state loss | State bucket is versioned; restore the previous object version. Never delete the bucket (`prevent_destroy`) |
| Data corruption / deletion | Supabase dashboard → Database → Backups → point-in-time restore into a new project, validate, then swap `NEXT_PUBLIC_SUPABASE_URL`/keys secrets and redeploy |
| Leaked secret | Rotate in Secrets Manager, redeploy, audit CloudTrail |

## Backups
- Supabase: daily backups + PITR (Pro plan or higher; **verify it is enabled**).
- S3 data bucket: versioned, 90-day noncurrent retention.
- If `enable_database` is turned on: RDS automated backups (14 days), final snapshot on deletion, deletion protection.

## Drills
Quarterly: restore the latest Supabase backup into a scratch project and run `scripts/ci/smoke-url.sh` against a preview pointing at it. Record the measured RTO.
