# Setup

## Local (app + observability)
```bash
cp .env.example .env.local        # fill TMDB + Supabase values
docker compose up --build         # app :3000, Grafana :3001 (admin/admin), Prometheus :9090, Alertmanager :9093
npm run test:ops                  # SLO maths + config checks (no Docker needed)
```

## One-time AWS + GitHub bootstrap
1. `cd infra/terraform/bootstrap && terraform init && terraform apply -var github_repo=OWNER/REPO` (admin credentials, once). Note the `state_bucket`, `plan_role_arn`, `deploy_role_arn` outputs.
2. Create the secrets in AWS Secrets Manager (`TMDB_API_READ_TOKEN`, `SUPABASE_SECRET_KEY`, `AUTH_JWT_SECRET` (`openssl rand -base64 48`), `RESEND_API_KEY`, `METRICS_TOKEN`, plus the two public Supabase values) and a Route 53 hosted zone.
3. For each env, apply once with a placeholder image to create ECR: `terraform -chdir=infra/terraform/envs/dev apply -target=module.stack.module.service.aws_ecr_repository.this ...` then let CI deploy real images.
4. GitHub repo **Variables:** `AWS_PLAN_ROLE_ARN`, `AWS_DEPLOY_ROLE_ARN`, `TF_STATE_BUCKET`, `ECR_REPOSITORY_URL` (per environment), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `PROMETHEUS_URL`. Per-environment variable `TF_VARS_JSON` = `{"root_domain":"…","hosted_zone_id":"…","alert_email":"…","secret_arns":{…}}` (see `terraform.tfvars.example`). Secret `PROMETHEUS_TOKEN` if Prometheus is authenticated.
5. `scripts/git/protect-main.sh OWNER/REPO <your-numeric-github-user-id>` – branch protection, production approvals, secret scanning.
6. Edit `.github/CODEOWNERS`. Pin third-party actions to commit SHAs (Dependabot will keep them current).

## Deploy / rollback
Merge to `main`. Rollback: see `docs/runbooks/rollback.md`.
