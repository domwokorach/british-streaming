import { expect, test } from "@playwright/test";

// /films renders without needing a TMDB token, and is tall enough once we pad it, so these tests are hermetic.
async function makeTall(page: import("@playwright/test").Page) {
  await page.addStyleTag({ content: "main { min-height: 4000px !important; }" });
}

test.describe("scroll motion", () => {
  test("header hides on scroll down, returns on scroll up, and is solid once scrolled", async ({ page }) => {
    await page.goto("/films");
    await makeTall(page);
    const header = page.locator("header").first();
    await expect(header).toHaveCSS("border-bottom-color", "rgba(0, 0, 0, 0)");

    await page.evaluate(() => window.scrollTo(0, 900));
    await expect.poll(() => header.evaluate((el) => el.getBoundingClientRect().bottom)).toBeLessThanOrEqual(0);

    await page.evaluate(() => window.scrollTo(0, 700));
    await expect.poll(() => header.evaluate((el) => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0);
    await expect(header).not.toHaveCSS("border-bottom-color", "rgba(0, 0, 0, 0)");
  });

  test("header stays visible while a keyboard user is focused inside it", async ({ page, browserName }) => {
    test.skip(browserName === "webkit", "Tab focus order differs on WebKit");
    await page.goto("/films");
    await makeTall(page);
    await page.keyboard.press("Tab");
    await page.evaluate(() => window.scrollTo(0, 900));
    await page.waitForTimeout(400);
    const top = await page.locator("header").first().evaluate((el) => el.getBoundingClientRect().top);
    expect(top).toBeGreaterThanOrEqual(0);
  });

  test("scroll-to-top appears after scrolling and returns to the top", async ({ page }) => {
    await page.goto("/films");
    await makeTall(page);
    const button = page.getByRole("button", { name: "Scroll to top" });
    await expect(button).toHaveCount(0);
    await page.evaluate(() => window.scrollTo(0, 1500));
    await expect(button).toBeVisible();
    await button.click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(5);
  });

  test("reading progress bar tracks scroll position", async ({ page }) => {
    await page.goto("/films");
    await makeTall(page);
    const bar = page.locator("div.origin-left.fixed");
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(() => bar.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a)).toBeGreaterThan(0.95);
  });

  test("reduced motion: content is visible immediately and the page never overflows horizontally", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");
    const hidden = await page.evaluate(() => [...document.querySelectorAll("[data-reveal]")].filter((el) => getComputedStyle(el).opacity === "0").length);
    expect(hidden).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    await context.close();
  });

  test("route changes do not scroll-jump or block navigation", async ({ page }) => {
    await page.goto("/films");
    await page.getByRole("link", { name: "Series" }).first().click();
    await expect(page).toHaveURL(/\/series$/);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });
});
