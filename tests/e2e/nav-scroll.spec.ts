import { expect, test, type Page } from "@playwright/test";

const DESTINATIONS = [
  { label: "Home", href: "/", id: "home-content" },
  { label: "Series", href: "/series", id: "series-content" },
  { label: "Films", href: "/films", id: "films-content" },
  { label: "New & Popular", href: "/new-popular", id: "popular-content" },
  { label: "Browse by language", href: "/browse/languages", id: "languages-content" },
] as const;

const HEADER = 64;

/** Navigate and wait for hydration: a click before React attaches is a plain browser navigation, which is correct but not what these tests exercise. */
async function visit(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

/** Resolves once the page has stopped scrolling (no change across consecutive frames). */
async function settled(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    let last = -1, still = 0;
    const tick = () => { const y = scrollY; still = y === last ? still + 1 : 0; last = y; still >= 12 ? resolve() : requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }));
}
const topOf = (page: Page, id: string) => page.evaluate((i) => document.getElementById(i)?.getBoundingClientRect().top ?? Infinity, id);
/** Smooth scrolling starts a frame or two after navigation, so wait for the target to arrive rather than for "stillness". */
const arrived = (page: Page, id: string) => expect.poll(() => topOf(page, id), { timeout: 10_000 }).toBeLessThan(HEADER + 80);

test.describe("desktop navigation scroll", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const dest of DESTINATIONS) {
    test(`${dest.label} opens the page and scrolls its content under the header`, async ({ page }) => {
      await visit(page, dest.href === "/" ? "/series" : "/");
      const link = page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: dest.label, exact: true });
      // "Browse by language" is hidden below xl; this viewport is 1440 so it is present.
      await link.click();
      await expect(page).toHaveURL(new RegExp(`${dest.href === "/" ? "/$" : dest.href + "$"}`));
      await expect(page.locator(`#${dest.id}`)).toBeAttached();
      await arrived(page, dest.id);
      await settled(page);
      const top = await topOf(page, dest.id);
      // Content starts below the fixed header, never hidden behind it, and has genuinely been scrolled to (not left far down the page).
      expect(top).toBeGreaterThanOrEqual(HEADER - 2);
      expect(top).toBeLessThan(HEADER + 80);
      expect(await page.locator("header").boundingBox().then((b) => b!.y)).toBeGreaterThanOrEqual(0);
      await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: dest.label, exact: true })).toHaveAttribute("aria-current", "page");
    });
  }

  test("clicking the active page's link scrolls to its content without reloading", async ({ page }) => {
    await visit(page, "/films");
    await page.evaluate(() => { (window as unknown as { __marker: number }).__marker = 1; });
    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Films", exact: true }).click();
    await arrived(page, "films-content");
    await settled(page);
    expect(await page.evaluate(() => (window as unknown as { __marker?: number }).__marker)).toBe(1);
    // Clicking again does not move the page or loop.
    const y = await page.evaluate(() => scrollY);
    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Films", exact: true }).click();
    await settled(page);
    expect(await page.evaluate(() => scrollY)).toBe(y);
  });

  test("back and forward restore position and do not trigger the nav scroll", async ({ page }) => {
    await visit(page, "/series");
    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Films", exact: true }).click();
    await expect(page).toHaveURL(/\/films$/);
    await arrived(page, "films-content");
    await page.goBack();
    await expect(page).toHaveURL(/\/series$/);
    await settled(page);
    expect(await page.evaluate(() => scrollY)).toBeLessThan(40); // back to the top of /series where we left it
    await page.goForward();
    await settled(page);
    await expect(page).toHaveURL(/\/films$/);
  });

  test("direct visits and refreshes do not auto-scroll", async ({ page }) => {
    await visit(page, "/films");
    await settled(page);
    expect(await page.evaluate(() => scrollY)).toBeLessThan(40); // not carried down to the content section
    await page.reload();
    await settled(page);
    expect(await page.evaluate(() => scrollY)).toBeLessThan(40);
  });

  test("the header stays fixed in view after the nav scroll", async ({ page }) => {
    await visit(page, "/");
    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Series", exact: true }).click();
    await arrived(page, "series-content");
    await settled(page);
    const box = (await page.locator("header").boundingBox())!;
    expect(box.y).toBeCloseTo(0, 1);
    await expect(page.locator("header")).toBeVisible();
  });
});

test("My List keeps its protected-route redirect for signed-out visitors and does not scroll the sign-in page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await visit(page, "/");
  await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "My List", exact: true }).click();
  await expect(page).toHaveURL(/\/account\/sign-in\?next=%2Fmy-list/);
  await settled(page);
  expect(await page.evaluate(() => scrollY)).toBe(0);
});

test("reduced motion: lands on the content immediately", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await visit(page, "/");
  await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Series", exact: true }).click();
  await expect(page).toHaveURL(/\/series$/);
  await arrived(page, "series-content");
  await ctx.close();
});

test.describe("touch navigation via the dock", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  test("tapping a dock item scrolls to content with no horizontal overflow", async ({ page }) => {
    await visit(page, "/");
    await page.getByRole("navigation", { name: "Quick navigation" }).getByRole("link", { name: "Series" }).tap();
    await expect(page).toHaveURL(/\/series$/);
 await arrived(page, "series-content");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });
});
