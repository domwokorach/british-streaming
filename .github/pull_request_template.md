## What and why

## Checklist
- [ ] Title follows Conventional Commits (`feat:`, `fix:`, `chore:`…)
- [ ] Tests / checks updated
- [ ] Reliability impact considered (new endpoints use `withMetrics`; SLO or alert changes regenerate `slo.rules.yml`)
- [ ] Infra changes: Terraform plan reviewed, no unintended deletions
- [ ] Rollback is `deploy.yml` with the previous `image_digest`
