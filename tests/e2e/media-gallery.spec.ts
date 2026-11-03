import { expect, test, type Page } from "@playwright/test";

const CARD = '[data-slot="carousel-item"] button[aria-label*="See more about"]';
const PREVIEW = "[data-hover-preview]";

async function openFilms(page: Page) {
  await page.goto("/films");
  await expect(page.locator(CARD).first()).toBeVisible();
}

test.describe("desktop hover preview", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("opens in a body-level portal, fully inside the viewport, and closes on leave", async ({ page }) => {
    await openFilms(page);
    const card = page.locator(CARD).nth(2);
    await card.scrollIntoViewIfNeeded();
    await card.hover();
    const preview = page.locator(PREVIEW);
    await expect(preview).toBeVisible();
    expect(await preview.evaluate((el) => el.parentElement === document.body)).toBe(true);
    const box = (await preview.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(1440);
    await page.mouse.move(5, 450);
    await expect(preview).toHaveCount(0);
  });

  test("edge cards grow inward and never leave the viewport", async ({ page }) => {
    await openFilms(page);
    const cards = page.locator(CARD);
    for (const which of ["first", "last-visible"] as const) {
      await page.mouse.move(5, 5);
      const target = which === "first" ? cards.first() : await lastVisible(page);
      await target.scrollIntoViewIfNeeded();
      await target.hover();
      const box = (await page.locator(PREVIEW).boundingBox())!;
      expect(box.x, `${which} left edge`).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, `${which} right edge`).toBeLessThanOrEqual(1440);
      expect(box.y, `${which} top`).toBeGreaterThanOrEqual(0);
    }
  });

  test("only one preview exists at a time", async ({ page }) => {
    await openFilms(page);
    await page.locator(CARD).nth(0).hover();
    await expect(page.locator(PREVIEW)).toHaveCount(1);
    await page.mouse.move(5, 450);
    await page.locator(CARD).nth(1).hover();
    await expect(page.locator(PREVIEW)).toHaveCount(1);
    await expect(page.locator(PREVIEW)).toHaveAttribute("aria-label", /preview/);
  });

  test("moving from the card into its preview does not flicker closed", async ({ page }) => {
    await openFilms(page);
    const card = page.locator(CARD).nth(2);
    await card.hover();
    const preview = page.locator(PREVIEW);
    await expect(preview).toBeVisible();
    const box = (await preview.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height - 20, { steps: 12 });
    await page.waitForTimeout(500);
    await expect(preview).toBeVisible();
  });

  test("Escape dismisses the preview", async ({ page }) => {
    await openFilms(page);
    await page.locator(CARD).nth(1).hover();
    await expect(page.locator(PREVIEW)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(PREVIEW)).toHaveCount(0);
  });

  test("details dialog opens, Escape closes it and focus returns to the card", async ({ page }) => {
    await openFilms(page);
    const card = page.locator(CARD).nth(1);
    await card.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(page.locator(PREVIEW)).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(card).toBeFocused();
  });

  test("every card in a row is reachable with the next arrow", async ({ page }) => {
    await openFilms(page);
    const row = page.locator('[data-slot="carousel"]').first();
    await row.hover();
    // Click via the DOM: moving a real pointer to the arrow crosses cards and would open hover previews over it.
    const clickNext = () => row.evaluate((el) => { const b = el.querySelector<HTMLButtonElement>('[data-slot="carousel-next"]'); if (!b || b.disabled) return false; b.click(); return true; });
    for (let i = 0; i < 12 && (await clickNext()); i++) await page.waitForTimeout(450);
    const lastBox = (await row.locator('[data-slot="carousel-item"]').last().boundingBox())!;
    expect(lastBox.x + lastBox.width).toBeLessThanOrEqual(1440);
    expect(lastBox.x).toBeGreaterThanOrEqual(0);
  });
});

test.describe("touch devices", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("tapping a card opens the details sheet and never a hover preview", async ({ page }) => {
    await openFilms(page);
    await page.locator(CARD).first().tap();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.locator(PREVIEW)).toHaveCount(0);
    // Touch users close with the on-screen button (Escape is covered by the desktop dialog test).
    await page.getByRole("dialog").getByRole("button", { name: "Close" }).tap();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});

async function lastVisible(page: Page) {
  const index = await page.locator(CARD).evaluateAll((els) => {
    let best = 0, bestRight = -1;
    els.forEach((el, i) => { const r = el.getBoundingClientRect(); if (r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.top < innerHeight && r.right > bestRight) { best = i; bestRight = r.right; } });
    return best;
  });
  return page.locator(CARD).nth(index);
}

test.describe("Popular in GB marquees", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  const strip = (page: Page, name: string) => page.getByRole("region", { name });
  const track = (page: Page, name: string) => strip(page, name).locator(".animate-scroll");
  const playState = (page: Page, name: string) => track(page, name).evaluate((el) => getComputedStyle(el).animationPlayState);

  test("both sections render, move, and loop with a hidden second copy", async ({ page }) => {
    await page.goto("/");
    for (const [name, dir] of [["Popular Films in GB", "normal"], ["Popular Series in GB", "reverse"]] as const) {
      const region = strip(page, name);
      await region.scrollIntoViewIfNeeded();
      await expect(region).toBeVisible();
      expect(await playState(page, name)).toBe("running");
      expect(await region.evaluate((el) => getComputedStyle(el).getPropertyValue("--animation-direction").trim())).toBe(dir === "normal" ? "forwards" : "reverse");
      const lists = region.locator("ul");
      await expect(lists).toHaveCount(2);
      await expect(lists.nth(1)).toHaveAttribute("aria-hidden", "true");
      // Only the first copy is in the tab order.
      expect(await lists.nth(1).locator("button[tabindex='0'], a[tabindex='0']").count()).toBe(0);
      expect(await lists.nth(0).locator("button").count()).toBe(await lists.nth(1).locator("button").count());
    }
  });

  test("hover pauses the strip, opens a preview above it, and the pause button works", async ({ page }) => {
    await page.goto("/");
    const name = "Popular Films in GB";
    await strip(page, name).scrollIntoViewIfNeeded();
    const pause = page.getByRole("button", { name: `Pause moving ${name}` });
    await pause.click();
    expect(await playState(page, name)).toBe("paused");
    await expect(page.getByRole("button", { name: `Resume moving ${name}` })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: `Resume moving ${name}` }).click();
    await page.mouse.move(5, 5);
    await expect.poll(() => playState(page, name)).toBe("running");

    const card = strip(page, name).locator("ul").first().locator("button[aria-label*='See more about']").nth(1);
    // Playwright's hover() waits for the target to stop moving, which a marquee never does; move the pointer to where it is.
    const cardBox = (await card.boundingBox())!;
    await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
    await expect.poll(() => playState(page, name)).toBe("paused");
    const preview = page.locator("[data-hover-preview]");
    await expect(preview).toBeVisible();
    expect(await preview.evaluate((el) => el.parentElement === document.body)).toBe(true);
    // Moving onto the (portal) preview keeps the strip paused so the card doesn't slide out from under it.
    const box = (await preview.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height - 20, { steps: 8 });
    await page.waitForTimeout(400);
    await expect(preview).toBeVisible();
    expect(await playState(page, name)).toBe("paused");
  });

  test("no horizontal page overflow", async ({ page }) => {
    await page.goto("/");
    await expect(strip(page, "Popular Series in GB")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });

  test("reduced motion: no movement, scrollable row, no pause button", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto("/");
    const region = strip(page, "Popular Films in GB");
    await expect(region).toBeVisible();
    await expect(region.locator(".animate-scroll")).toHaveCount(0);
    await expect(region.locator("ul")).toHaveCount(1);
    expect(await region.evaluate((el) => getComputedStyle(el).overflowX)).toBe("auto");
    await expect(page.getByRole("button", { name: /Pause moving/ })).toHaveCount(0);
    await ctx.close();
  });
});
