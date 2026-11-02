#!/usr/bin/env bash
# Post-deploy smoke test against a live URL. Usage: smoke-url.sh https://staging.example.com
set -euo pipefail
BASE="${1:?base url required}"
for i in $(seq 1 30); do
  if curl -fsS "$BASE/api/health" | grep -q '"status":"ok"'; then break; fi
  [ "$i" = 30 ] && { echo "health never became ok"; exit 1; }
  sleep 10
done
curl -fsS "$BASE/api/ready" | grep -q '"status":"ready"'
test "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/")" = 200
test "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/trending")" = 200
curl -sI "$BASE/" | grep -qi '^strict-transport-security' || echo "warning: HSTS header missing"
echo "smoke test passed for $BASE"
