#!/usr/bin/env bash
# Applies branch protection to main and environment protection rules. Needs repo-admin `gh` auth.
# Usage: scripts/git/protect-main.sh OWNER/REPO REVIEWER_USER_ID
set -euo pipefail
REPO="${1:?OWNER/REPO}"; REVIEWER="${2:?numeric GitHub user id for production approvals}"

gh api -X PUT "repos/$REPO/branches/main/protection" --input - <<JSON
{
  "required_status_checks": { "strict": true, "contexts": ["validate", "e2e", "secrets-and-deps", "terraform", "container", "conventional-commits"] },
  "enforce_admins": true,
  "required_pull_request_reviews": { "required_approving_review_count": 1, "require_code_owner_reviews": true, "dismiss_stale_reviews": true },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
JSON

gh api -X PUT "repos/$REPO/environments/production" --input - <<JSON
{ "reviewers": [{ "type": "User", "id": $REVIEWER }], "deployment_branch_policy": { "protected_branches": true, "custom_branch_policies": false } }
JSON
for env in dev staging; do gh api -X PUT "repos/$REPO/environments/$env" >/dev/null; done
gh api -X PUT "repos/$REPO/vulnerability-alerts" >/dev/null
gh api -X PATCH "repos/$REPO" -f 'security_and_analysis[secret_scanning][status]=enabled' -f 'security_and_analysis[secret_scanning_push_protection][status]=enabled' >/dev/null
echo "Protection applied to $REPO"
