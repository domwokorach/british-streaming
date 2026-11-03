import { expect, test } from "@playwright/test";

test("floating dock shows on phones, stays out of the way at the top on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/films");
  const bottom = page.getByRole("navigation", { name: "Quick navigation" });
  await expect(bottom).toBeVisible();
  await expect(bottom.getByRole("link")).toHaveCount(6);
  await expect(bottom.getByRole("link", { name: "Films" })).toHaveAttribute("aria-current", "page");
  await bottom.getByRole("link", { name: "Series" }).click();
  await expect(page).toHaveURL(/\/series$/);

  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(bottom).toBeHidden();
});

test("auth screens have no floating dock", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/account/sign-in", "/account/register", "/account/forgot-password"]) {
    await page.goto(path);
    await expect(page.getByRole("navigation", { name: "Quick navigation" })).toHaveCount(0);
  }
});

test("unknown pages and the disabled ops page do not expose data", async ({ page }) => {
  await page.goto("/ops");
  await expect(page.getByText("Reliability & Operations")).toHaveCount(0);
});

test.describe("404 page", () => {
  test("shows the not-found screen with working actions", async ({ page }) => {
    const response = await page.goto("/definitely-not-a-page");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Page Not Found");
    await page.getByRole("link", { name: "Explore Films" }).click();
    await expect(page).toHaveURL(/\/films$/);
  });

  test("Back to Home and Go Back fall back to Home without history", async ({ page }) => {
    await page.goto("/definitely-not-a-page");
    await page.getByRole("button", { name: "Go Back" }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/definitely-not-a-page");
    await page.getByRole("link", { name: "Back to Home" }).first().click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("has no horizontal overflow from 320px up and is keyboard reachable", async ({ page }) => {
    for (const width of [320, 390, 768, 1280, 1920]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/definitely-not-a-page");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe("BODY");
  });

  test("reduced motion renders no animated canvas", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/definitely-not-a-page");
    await expect(page.locator("main canvas")).toHaveCount(0);
  });
});
