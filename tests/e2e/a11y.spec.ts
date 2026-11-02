import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// WCAG 2.2 AA target. Fails on serious/critical violations; lesser ones are attached to the report.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

for (const path of ["/", "/films", "/series", "/account/sign-in", "/account/register", "/account/forgot-password", "/account/reset-password", "/account/verify-email", "/account/verify-email?sent=1&email=a%40b.co"]) {
  test(`axe: ${path}`, async ({ page }, testInfo) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    await testInfo.attach("axe-violations", { body: JSON.stringify(violations, null, 2), contentType: "application/json" });
    const blocking = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)`)).toEqual([]);
  });
}
