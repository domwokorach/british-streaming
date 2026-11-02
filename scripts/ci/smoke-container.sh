#!/usr/bin/env bash
# Boots the image with read-only rootfs and non-root user, then checks the operational endpoints.
set -euo pipefail
IMAGE="${1:?image ref required}"
NAME="ws-smoke-$$"
trap 'docker rm -f "$NAME" >/dev/null 2>&1 || true' EXIT

docker run -d --name "$NAME" -p 3000:3000 --read-only --tmpfs /tmp --tmpfs /app/.next/cache \
  --cap-drop ALL --security-opt no-new-privileges --memory 512m \
  -e NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co -e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=placeholder \
  -e TMDB_API_READ_TOKEN=smoke -e METRICS_TOKEN=smoke "$IMAGE" >/dev/null

for i in $(seq 1 30); do curl -fsS localhost:3000/api/health >/dev/null 2>&1 && break; sleep 1; done
curl -fsS localhost:3000/api/health | grep -q '"status":"ok"'
curl -fsS localhost:3000/api/ready  | grep -q '"status":"ready"'
test "$(curl -s -o /dev/null -w '%{http_code}' localhost:3000/api/metrics)" = 401
curl -fsS -H 'authorization: Bearer smoke' localhost:3000/api/metrics | grep -q '^app_info'
test "$(docker exec "$NAME" id -u)" != 0
echo "container smoke test passed"
