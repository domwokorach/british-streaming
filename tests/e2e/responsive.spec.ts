import { expect, test } from "@playwright/test";

const PAGES = ["/", "/films", "/series", "/new-popular", "/account/sign-in", "/account/register", "/account/forgot-password", "/account/reset-password", "/account/verify-email"];
const WIDTHS = [320, 375, 425, 768, 1024, 1440, 1920];

test.describe("no horizontal overflow at spec breakpoints", () => {
  for (const path of PAGES) {
    test(path, async ({ page }) => {
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(path);
        // Poll: carousels briefly lay out unclipped before they hydrate, so assert the settled state.
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), { message: `${path} at ${width}px overflows horizontally`, timeout: 5000 }).toBeLessThanOrEqual(0);
      }
    });
  }
});

test("viewport meta covers notches", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute("content", /viewport-fit=cover/);
});
