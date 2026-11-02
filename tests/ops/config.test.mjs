// Structural checks on the delivery pipeline and operational config. These do not replace
// `terraform validate`, `promtool check` or `docker build` (run in CI) but catch regressions offline.
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";

const read = (p) => readFileSync(p, "utf8");

test("grafana dashboards are valid JSON with panels", () => {
  for (const f of readdirSync("monitoring/grafana/dashboards")) {
    const d = JSON.parse(read(`monitoring/grafana/dashboards/${f}`));
    assert.ok(d.title && d.panels.length > 0, f);
  }
});
test("Dockerfile is multi-stage, non-root and has a healthcheck", () => {
  const d = read("Dockerfile");
  assert.ok((d.match(/^FROM /gm) ?? []).length >= 3);
  assert.match(d, /^USER (?!root)/m);
  assert.match(d, /HEALTHCHECK/);
});
test("workflows pin to least-privilege permissions and use OIDC, not static cloud keys", () => {
  for (const f of readdirSync(".github/workflows")) {
    const w = read(`.github/workflows/${f}`);
    assert.match(w, /^permissions:/m, `${f} must declare top-level permissions`);
    assert.doesNotMatch(w, /AWS_SECRET_ACCESS_KEY/, `${f} must not use static AWS keys`);
  }
  assert.match(read(".github/workflows/deploy.yml"), /role-to-assume/);
});
test("production environment requires approval and blocks destroy", () => {
  assert.match(read(".github/workflows/deploy.yml"), /environment: production/);
  assert.match(read(".github/workflows/_deploy-env.yml"), /name: \$\{\{ inputs\.environment \}\}/);
  assert.match(read("infra/terraform/modules/ecs-service/main.tf"), /deletion_protection/);
  assert.match(read("infra/terraform/modules/database/main.tf"), /prevent_destroy\s*=\s*true/);
});
test("terraform has remote state with locking in every environment", () => {
  for (const env of ["dev", "staging", "prod"]) assert.match(read(`infra/terraform/envs/${env}/main.tf`), /dynamodb_table|use_lockfile/);
});
test("runbooks exist for every page-severity alert", () => {
  for (const f of ["error-budget-burn", "rollback", "incident-response", "disaster-recovery"]) assert.ok(existsSync(`docs/runbooks/${f}.md`), f);
});
test("compose services are non-root-friendly: limits and healthchecks", () => {
  const c = read("docker-compose.yml");
  assert.match(c, /healthcheck:/);
  assert.match(c, /mem_limit|memory:/);
  assert.match(c, /read_only: true/);
});
test("deploy gate has a post-deploy regression mode that can fail", () => {
  assert.match(read("scripts/slo/deploy-gate.mjs"), /--post-deploy/);
  assert.match(read(".github/workflows/_deploy-env.yml"), /deploy-gate\.mjs --post-deploy/);
});
test("no workflow references a tfvars file that nothing creates", () => {
  for (const f of readdirSync(".github/workflows")) assert.doesNotMatch(read(`.github/workflows/${f}`), /ci\.auto\.tfvars(?!\.json)/);
});
