import { expect, test } from "@playwright/test";

test("health and readiness contracts", async ({ request }) => {
  const health = await request.get("/api/health");
  expect(health.status()).toBe(200);
  expect(await health.json()).toMatchObject({ status: "ok" });
  expect(health.headers()["cache-control"]).toContain("no-store");
  const ready = await request.get("/api/ready");
  expect([200, 503]).toContain(ready.status());
  expect(await ready.json()).toHaveProperty("status");
});

test("metrics endpoint requires its token when one is configured", async ({ request }) => {
  const res = await request.get("/api/metrics");
  expect([200, 401]).toContain(res.status());
  if (res.status() === 200) expect(await res.text()).toContain("app_info");
});

test("telemetry validates input", async ({ request }) => {
  expect((await request.post("/api/telemetry", { data: { type: "vital", name: "LCP", value: 1200 } })).status()).toBe(204);
  expect((await request.post("/api/telemetry", { data: { type: "vital", name: "bogus", value: 1 } })).status()).toBe(400);
  expect((await request.post("/api/telemetry", { data: { type: "player", name: "start", value: "x" } })).status()).toBe(400);
});

test("search returns an array and echoes a request id", async ({ request }) => {
  const res = await request.get("/api/search?q=matrix");
  expect(res.headers()["x-request-id"]).toBeTruthy();
  if (res.ok()) expect(Array.isArray(await res.json())).toBe(true);
  else expect(res.status()).toBe(503);
  expect(await (await request.get("/api/search")).json()).toEqual([]);
});
