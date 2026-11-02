import { expect, test } from "@playwright/test";
import { apiContext, BASE, PASSWORD, registerAndVerify, uiSignIn, uniqueEmail, waitForMail } from "./helpers";

const PROTECTED = ["/browse", "/my-list", "/watch-history", "/account", "/account/profile", "/account/settings"];

test("protected pages redirect guests to sign-in and remember the destination", async ({ page }) => {
  for (const path of PROTECTED) {
    await page.goto(path);
    await page.waitForURL(/\/account\/sign-in/);
    expect(new URL(page.url()).searchParams.get("next"), path).toBe(path);
    await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
  }
});

test("public pages stay public", async ({ page }) => {
  for (const path of ["/", "/films", "/account/sign-in", "/account/register", "/account/forgot-password"]) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(200);
    expect(new URL(page.url()).pathname).toBe(path);
  }
});

test("full journey: register → verify → sign in → destination restored → survives reload → sign out", async ({ page }) => {
  const api = await apiContext(BASE());
  const email = uniqueEmail("journey");

  await page.goto("/my-list");
  await expect(page).toHaveURL(/\/account\/sign-in\?next=%2Fmy-list/);
  await page.getByRole("link", { name: "Create a new account" }).click();
  await expect(page).toHaveURL(/\/account\/register/);

  await page.getByLabel("Full name").fill("Grace Hopper");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirm password").fill(PASSWORD);
  await page.getByRole("checkbox", { name: /Terms and Conditions/ }).check();
  await page.getByRole("button", { name: "Create Account" }).click();

  await expect(page).toHaveURL(/\/account\/verify-email\?sent=1/);
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();

  const mail = await waitForMail(api, email, "verify");
  await page.goto(mail.link!.replace(/^https?:\/\/[^/]+/, ""));
  await expect(page.getByRole("heading", { name: "Email verified" })).toBeVisible();
  await expect(page).not.toHaveURL(/token=/); // one-time token scrubbed from the address bar

  await page.getByRole("link", { name: "Continue to Sign In" }).click();
  await expect(page.getByText("Email verified. You can sign in now.")).toBeVisible();

  await page.goto("/my-list");
  await uiSignIn(page, email);
  await expect(page).toHaveURL(/\/my-list$/); // validated internal destination restored
  await expect(page.getByRole("heading", { name: "My List" })).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(/\/my-list$/);
  await page.goto("/account/profile");
  await expect(page.getByText(email)).toBeVisible();
  await expect(page.getByText("Verified")).toBeVisible();

  await page.goto("/account/sign-in");
  await expect(page).toHaveURL(/\/$/); // already signed in: bounced away from the guest-only page

  await page.goto("/account/settings");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/account\/sign-in/);
  await page.goto("/account/profile");
  await expect(page).toHaveURL(/\/account\/sign-in\?next=%2Faccount%2Fprofile/);
  await api.dispose();
});

test("open-redirect attempts are ignored after sign-in", async ({ page }) => {
  const api = await apiContext(BASE());
  const { email } = await registerAndVerify(api);
  for (const evil of ["//evil.example/x", "https://evil.example", "/\\evil.example", "javascript:alert(1)"]) {
    await page.goto(`/account/sign-in?next=${encodeURIComponent(evil)}`);
    await uiSignIn(page, email);
    await expect(page).toHaveURL(/^http:\/\/127\.0\.0\.1:\d+\/$/);
    await page.context().clearCookies();
  }
  await api.dispose();
});

test("sign-in form: validation, show/hide password, Enter key, generic error, no duplicate submit", async ({ page }) => {
  await page.goto("/account/sign-in");
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  await expect(page.getByText("Enter your password.")).toBeVisible();

  const password = page.getByLabel("Password", { exact: true });
  await password.fill("hunter2hunter2");
  await expect(password).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(password).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Hide password" }).click();
  await expect(password).toHaveAttribute("type", "password");

  let posts = 0;
  page.on("request", (r) => { if (r.url().endsWith("/api/auth/sign-in") && r.method() === "POST") posts++; });
  await page.getByLabel("Email address").fill(uniqueEmail("nobody"));
  await password.press("Enter"); // keyboard submit
  await expect(page.getByRole("alert").filter({ hasText: "Incorrect email or password." })).toBeVisible();
  expect(posts).toBe(1);
  await expect(page.getByRole("link", { name: "Forgot password?" })).toHaveAttribute("href", "/account/forgot-password");
  await expect(page.getByLabel("Remember me")).not.toBeChecked();
});

test("unverified accounts are told to verify and can resend the email", async ({ page }) => {
  const api = await apiContext(BASE());
  const email = uniqueEmail("unverified");
  await api.post("/api/auth/register", { data: { fullName: "U", email, password: PASSWORD, acceptTerms: true } });
  await waitForMail(api, email, "verify");
  await page.goto("/account/sign-in");
  await uiSignIn(page, email);
  await expect(page.getByText("Please verify your email address before signing in.")).toBeVisible();
  await page.getByRole("button", { name: "Resend verification email" }).click();
  await waitForMail(api, email, "verify", { count: 2 });
  await api.dispose();
});

test("register form: live validation, strength meter, confirmation and terms", async ({ page }) => {
  await page.goto("/account/register");
  const password = page.getByLabel("Password", { exact: true });
  await password.fill("abc");
  await password.blur();
  await expect(page.getByText(/Use at least 10 characters/).first()).toBeVisible();
  await expect(page.getByText("Password strength:")).toContainText("Too weak");
  await password.fill("Sup3r-long-passphrase!");
  await expect(page.getByText("Password strength:")).toContainText("Strong");

  await page.getByLabel("Confirm password").fill("different");
  await page.getByLabel("Confirm password").blur();
  await expect(page.getByText("Passwords don't match.")).toBeVisible();

  await page.getByLabel("Email address").fill("not-an-email");
  await page.getByLabel("Email address").blur();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();

  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page.getByText("You must accept the Terms and Conditions.")).toBeVisible();
  await expect(page).toHaveURL(/\/account\/register/); // nothing submitted
});

test("forgot → reset: generic confirmation, strength check, success, link is single-use", async ({ page }) => {
  const api = await apiContext(BASE());
  const { email } = await registerAndVerify(api);

  await page.goto("/account/forgot-password");
  await page.getByLabel("Email address").fill("bad");
  await page.getByRole("button", { name: "Send Reset Link" }).click();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();

  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Send Reset Link" }).click();
  await expect(page.getByText(/If an account exists for that email/)).toBeVisible();

  const link = (await waitForMail(api, email, "reset")).link!.replace(/^https?:\/\/[^/]+/, "");
  await page.goto(link);
  await expect(page).not.toHaveURL(/token=/);
  const NEW = "a-brand-new-password-1";
  await page.getByLabel("New password", { exact: true }).fill("short");
  await page.getByLabel("Confirm new password").fill("short");
  await page.getByRole("button", { name: "Reset Password" }).click();
  await expect(page.getByText(/Use at least 10 characters/).first()).toBeVisible();

  await page.getByLabel("New password", { exact: true }).fill(NEW);
  await page.getByLabel("Confirm new password").fill(NEW);
  await page.getByRole("button", { name: "Reset Password" }).click();
  await expect(page.getByRole("heading", { name: "Password updated" })).toBeVisible();
  await waitForMail(api, email, "password_changed");

  await page.getByRole("link", { name: "Return to Sign In" }).click();
  await uiSignIn(page, email, PASSWORD);
  await expect(page.getByText("Incorrect email or password.")).toBeVisible();
  await page.getByLabel("Password", { exact: true }).fill(NEW);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/$/);

  // Reusing the same link now shows the expired state.
  await page.waitForLoadState("networkidle"); // sign-in's router.refresh() must finish before we navigate away
  await page.context().clearCookies();
  await page.goto(link);
  await expect(page.getByRole("heading", { name: "Reset password" })).toBeVisible();
  await page.getByLabel("New password", { exact: true }).fill(NEW + "x");
  await page.getByLabel("Confirm new password").fill(NEW + "x");
  await page.getByRole("button", { name: "Reset Password" }).click();
  await expect(page.getByRole("heading", { name: "Link expired" })).toBeVisible();
  await api.dispose();
});

test("reset page without a token shows the expired state", async ({ page }) => {
  await page.goto("/account/reset-password");
  await expect(page.getByRole("heading", { name: "Link expired" })).toBeVisible();
  await page.getByRole("link", { name: "Request a new link" }).click();
  await expect(page).toHaveURL(/forgot-password/);
});

test("an invalid verification link explains itself", async ({ page }) => {
  await page.goto(`/account/verify-email?token=${"z".repeat(43)}`);
  await expect(page.getByRole("heading", { name: "Link expired" })).toBeVisible();
});

test("an expired access token is renewed transparently while browsing", async ({ page, context }) => {
  const api = await apiContext(BASE());
  const { email } = await registerAndVerify(api);
  await page.goto("/account/sign-in");
  await uiSignIn(page, email);
  await expect(page).toHaveURL(/\/$/);
  // Simulate the 15-minute access token lapsing: drop only that cookie, keep the refresh cookie.
  await context.clearCookies({ name: "ws_at" });
  await page.goto("/account/profile"); // proxy → /account/session-refresh → refresh → full reload of profile
  await expect(page).toHaveURL(/\/account\/profile$/, { timeout: 20_000 }); // a network round trip plus a page load
  await expect(page.getByText(email)).toBeVisible();
  await api.dispose();
});

test("auth pages are usable on this device: touch targets, no overflow, safe-area padding", async ({ page }) => {
  for (const path of ["/account/sign-in", "/account/register", "/account/forgot-password"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
    const submit = page.locator("button[type=submit]");
    const box = await submit.boundingBox();
    expect(box!.height, `${path} submit height`).toBeGreaterThanOrEqual(44);
    await expect(page.locator("main")).toHaveCSS("min-height", /\d/);
    // The primary button must be reachable without horizontal scrolling.
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  }
});

test("forms are inert until hydrated, so input is never lost and credentials can't be submitted into the URL", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false }); // equivalent to "before hydration"
  const page = await context.newPage();
  for (const path of ["/account/sign-in", "/account/register", "/account/forgot-password"]) {
    await page.goto(path);
    await expect(page.locator("button[type=submit]"), path).toBeDisabled();
    for (const input of await page.locator("form input:not([type=checkbox])").all()) await expect(input).toHaveJSProperty("readOnly", true);
    await expect(page.locator("form")).toHaveAttribute("method", "post");
  }
  await context.close();
});
