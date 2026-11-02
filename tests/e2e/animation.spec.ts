import { expect, test, type Page } from "@playwright/test";

const catalogue = async (page: Page) => {
  const carousels = page.locator('[data-slot="carousel"]');
  const count = await carousels.count();
  test.skip(count === 0, "TMDB catalogue not configured");
  return carousels;
};

/** Embla applies the scroll position as a translate on the track; read its x offset. */
/** Waits until the track stops gliding (two identical reads 300 ms apart) and returns its resting x. */
async function restingX(page: Page) {
  let last = Number.NaN;
  await expect.poll(async () => { const x = await trackX(page); const settled = x === last; last = x; if (!settled) await page.waitForTimeout(300); return settled; }, { timeout: 8000 }).toBe(true);
  return last;
}

const trackX = (page: Page, index = 0) =>
  page.locator('[data-slot="carousel-content"] > div').nth(index).evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);

test.describe("carousels", () => {
  test("arrow keys and buttons move a row, with no horizontal page overflow", async ({ page, isMobile }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle"); // carousels re-initialise during hydration
    const carousels = await catalogue(page);
    const row = carousels.nth(0);
    await row.scrollIntoViewIfNeeded();
    const firstCard = row.getByRole("button", { name: /^(Recently added: )?See more about/ }).first();
    await firstCard.focus();
    const before = await trackX(page);
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => trackX(page), { message: "ArrowRight should scroll the row" }).toBeLessThan(before);
    await page.keyboard.press("ArrowLeft");
    await expect.poll(() => trackX(page)).toBeGreaterThanOrEqual(before - 1);

    if (!isMobile) {
      await row.hover();
      const next = row.getByRole("button", { name: "Next slide" });
      await expect(next).toBeVisible();
      const x0 = await trackX(page);
      await next.click();
      await expect.poll(() => trackX(page)).not.toBe(x0);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });

  test("automatic sliding is pausable, and advances only while the row is idle and visible", async ({ page }) => {
    test.setTimeout(45_000);
    await page.goto("/");
    await page.waitForLoadState("networkidle"); // carousels re-initialise during hydration
    const carousels = await catalogue(page);
    const row = carousels.nth(0);
    const pause = page.getByRole("button", { name: /Pause automatic sliding/ });
    test.skip((await pause.count()) === 0, "first row has no autoplay (too few titles)");
    await row.scrollIntoViewIfNeeded();
    await page.mouse.move(1, 1); // not hovering the row
    const start = await trackX(page);
    await expect.poll(() => trackX(page), { timeout: 15_000, message: "should auto-advance" }).not.toBe(start);

    await pause.click();
    await expect(page.getByRole("button", { name: /Resume automatic sliding/ })).toHaveAttribute("aria-pressed", "true");
    await page.mouse.move(1, 1);
    const held = await restingX(page); // let any in-flight glide finish first
    await page.waitForTimeout(9000);
    expect(await trackX(page)).toBe(held);
  });

  test("autoplay is off when the user prefers reduced motion", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");
    test.skip((await page.locator('[data-slot="carousel"]').count()) === 0, "TMDB catalogue not configured");
    await expect(page.getByRole("button", { name: /automatic sliding/ })).toHaveCount(0);
    await context.close();
  });
});

test.describe("cards", () => {
  test("hover reveals Play / My List on pointer devices; tapping opens details on touch devices", async ({ page, hasTouch, isMobile }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle"); // carousels re-initialise during hydration
    const carousels = await catalogue(page);
    await carousels.nth(0).scrollIntoViewIfNeeded();
    const card = carousels.nth(0).getByRole("button", { name: /^(Recently added: )?See more about/ }).first();
    if (hasTouch || isMobile) {
      await card.tap();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
    } else {
      await card.hover();
      await expect(page.getByRole("button", { name: /^Play / }).first()).toBeVisible();
      await expect(page.getByRole("button", { name: /to My List$/ }).first()).toBeVisible();
    }
  });

  test("reduced motion shows every reveal immediately", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/films");
    const hidden = await page.evaluate(() => [...document.querySelectorAll("[data-reveal]")].filter((el) => getComputedStyle(el).opacity === "0").length);
    expect(hidden).toBe(0);
    await context.close();
  });
});

test.describe("auth screen animation", () => {
  test("fields ease in, an error alert animates in and settles fully visible, and the form still submits", async ({ page }) => {
    await page.goto("/account/sign-in");
    const email = page.getByLabel("Email address");
    await expect(email).toBeVisible();
    await expect(page.locator("form > div").first()).toHaveCSS("opacity", "1"); // stagger finished

    await email.fill("nobody@example.com");
    await page.getByLabel("Password", { exact: true }).fill("not-the-password");
    await page.getByLabel("Password", { exact: true }).press("Enter");
    const alert = page.getByRole("alert").filter({ hasText: "Incorrect email or password." });
    await expect(alert).toBeVisible();
    await expect(alert).toHaveCSS("opacity", "1");
    await expect(alert).toHaveCSS("transform", /^(none|matrix\(1, 0, 0, 1, 0, 0\))$/); // shake returned to rest
  });

  test("password visibility icon swaps without losing the typed value", async ({ page }) => {
    await page.goto("/account/register");
    const pw = page.getByLabel("Password", { exact: true });
    await pw.fill("a-long-passphrase-1");
    await page.getByRole("button", { name: "Show password" }).first().click();
    await expect(pw).toHaveAttribute("type", "text");
    await expect(pw).toHaveValue("a-long-passphrase-1");
    await expect(page.getByRole("button", { name: "Hide password" }).first()).toBeVisible();
  });

  test("auth pages are fully visible immediately under reduced motion", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    for (const path of ["/account/sign-in", "/account/register", "/account/forgot-password"]) {
      await page.goto(path);
      const hidden = await page.evaluate(() => [...document.querySelectorAll("[data-reveal]")].filter((el) => getComputedStyle(el).opacity === "0").length);
      expect(hidden, path).toBe(0);
    }
    await context.close();
  });
});

test.describe("premium components", () => {
  test("settings tabs switch panels and the accordion expands and collapses", async ({ page, request }) => {
    const { registerAndVerify, uiSignIn, apiContext, BASE } = await import("./helpers");
    const api = await apiContext(BASE());
    const { email } = await registerAndVerify(api);
    await page.goto("/account/sign-in?next=%2Faccount%2Fsettings");
    await uiSignIn(page, email);
    await expect(page).toHaveURL(/\/account\/settings$/);

    await expect(page.getByRole("tab", { name: "Devices" })).toHaveAttribute("aria-selected", "true");
    await page.getByRole("tab", { name: "Security tips" }).click();
    await expect(page.getByRole("tab", { name: "Security tips" })).toHaveAttribute("aria-selected", "true");

    const trigger = page.getByRole("button", { name: "Why review signed-in devices?" });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText(/sign it out here and change your password/)).toBeVisible();
    await trigger.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    void request;
    await api.dispose();
  });
});

test.describe("animation playground", () => {
  test("controls update the live preview immediately", async ({ page }) => {
    await page.goto("/dev/scroll-lab");
    const code = page.locator("aside pre");
    await expect(code).toContainText('effect="slide"');

    await page.getByLabel("Animation type").selectOption("zoom-in");
    await expect(code).toContainText('effect="zoom-in"');
    await page.getByLabel("Easing").selectOption("back");
    await expect(code).toContainText('easing="back"');
    await page.getByLabel(/^Duration/).fill("1.5");
    await expect(code).toContainText("duration={1.5}");
    await page.getByLabel(/^Delay/).fill("0.5");
    await expect(code).toContainText("delay={0.5}");
    await page.getByLabel(/^Trigger threshold/).fill("0.6");
    await expect(code).toContainText("amount={0.6}");

    // Spring: stiffness / damping drive the damping-ratio readout.
    await page.getByLabel(/^Spring stiffness/).fill("300");
    await page.getByLabel(/^Spring damping/).fill("5");
    await expect(code).toContainText("stiffness: 300, damping: 5");
    await expect(page.getByTestId("spring-feel")).toHaveText("very bouncy");
    await page.getByLabel(/^Spring damping/).fill("40");
    await expect(page.getByTestId("spring-feel")).toHaveText("sluggish");
  });

  test("the spring ball really moves when toggled, pause/resume and reduced-motion preview work", async ({ page }) => {
    await page.goto("/dev/scroll-lab");
    await page.waitForLoadState("networkidle"); // let hydration finish so the preview isn't re-created under us
    const ball = page.getByTestId("spring-ball");
    await expect(ball).toBeAttached();
    await ball.scrollIntoViewIfNeeded();
    const x0 = await ball.evaluate((el) => el.getBoundingClientRect().x);
    await page.getByRole("button", { name: "Toggle" }).click();
    await expect.poll(() => ball.evaluate((el) => el.getBoundingClientRect().x)).toBeGreaterThan(x0 + 100);

    const pause = page.getByRole("button", { name: "Pause" });
    await pause.click();
    await expect(page.getByRole("button", { name: "Resume" })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Resume" }).click();
    await page.getByRole("button", { name: "Play", exact: true }).click(); // replay resets the preview scroller
    await page.getByLabel("Reduced-motion preview").check();
    await expect(page.getByLabel("Reduced-motion preview")).toBeChecked();
  });
});

test.describe("integration", () => {
  test("no hydration warnings or runtime errors on animated pages", async ({ page }) => {
    const problems: string[] = [];
    page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && /hydrat|did not match|server rendered/i.test(m.text())) problems.push(m.text()); });
    for (const path of ["/", "/films", "/series", "/account/sign-in", "/account/register", "/account/forgot-password", "/dev/scroll-lab"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
    }
    expect(problems).toEqual([]);
  });

  test("route changes replay the page-enter transition and settle fully visible", async ({ page }) => {
    await page.goto("/films");
    await page.goto("/account/sign-in");
    const wrapper = page.locator(".page-enter").first();
    await expect(wrapper).toHaveCount(1);
    await expect(wrapper).toHaveCSS("opacity", "1");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });
});
