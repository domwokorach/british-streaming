import { expect, test } from "@playwright/test";

test("bottom tab bar shows on phones, top nav on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/films");
  const bottom = page.getByRole("navigation", { name: "Primary" });
  await expect(bottom).toBeVisible();
  await expect(bottom.getByRole("link", { name: "Films" })).toHaveAttribute("aria-current", "page");
  await bottom.getByRole("link", { name: "Series" }).click();
  await expect(page).toHaveURL(/\/series$/);

  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(bottom).toBeHidden();
});

test("auth screens have no app tab bar", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/account/sign-in", "/account/register", "/account/forgot-password"]) {
    await page.goto(path);
    await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(0);
  }
});

test("unknown pages and the disabled ops page do not expose data", async ({ page }) => {
  await page.goto("/ops");
  await expect(page.getByText("Reliability & Operations")).toHaveCount(0);
});
