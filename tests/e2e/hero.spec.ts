import { expect, test } from "@playwright/test";

// The hero needs the TMDB catalogue; without a token the home page shows an empty state and these are skipped.
test.describe("hero carousel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    test.skip((await page.getByRole("region", { name: "Featured titles" }).count()) === 0, "TMDB catalogue not configured");
  });

  test("slides can be chosen, paused, and moved with the keyboard", async ({ page }) => {
    const hero = page.getByRole("region", { name: "Featured titles" });
    const tabs = hero.getByRole("tab");
    test.skip((await tabs.count()) < 2, "needs at least two slides");

    await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
    await tabs.nth(1).click();
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");

    // Slide 2 is selected; ArrowRight wraps to slide 3, or back to slide 1 when only two slides exist.
    const expected = (await tabs.count()) > 2 ? 2 : 0;
    await tabs.nth(1).focus();
    await page.keyboard.press("ArrowRight");
    await expect(tabs.nth(expected)).toHaveAttribute("aria-selected", "true");

    const pause = hero.getByRole("button", { name: /pause auto-play/i });
    await pause.click();
    await expect(hero.getByRole("button", { name: /resume auto-play/i })).toBeVisible();
  });

  test("auto-advances after the configured interval", async ({ page }) => {
    test.setTimeout(30_000);
    const hero = page.getByRole("region", { name: "Featured titles" });
    const tabs = hero.getByRole("tab");
    test.skip((await tabs.count()) < 2, "needs at least two slides");
    await page.mouse.move(0, 0); // ensure not hovering (hover pauses)
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true", { timeout: 15_000 });
  });

  test("auto-play is disabled when the user prefers reduced motion", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");
    const hero = page.getByRole("region", { name: "Featured titles" });
    test.skip((await hero.count()) === 0, "TMDB catalogue not configured");
    await expect(hero.getByRole("button", { name: /pause auto-play/i })).toHaveCount(0);
    await page.waitForTimeout(9_000);
    await expect(hero.getByRole("tab").first()).toHaveAttribute("aria-selected", "true");
    await context.close();
  });
});
