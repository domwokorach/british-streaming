import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3210);
const SHORT_PORT = PORT + 1; // second server with tiny token lifetimes, to test expiry/rotation without long waits
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${PORT}`;
const shortURL = `http://127.0.0.1:${SHORT_PORT}`;

// The in-memory auth store + loopback-only unsafe test mode keep tests hermetic (no database or mail provider).
const authEnv = (url: string) => ({
  AUTH_STORE: "memory",
  ANIMATION_LAB_ENABLED: "true", // exposes /dev/scroll-lab so the playground can be tested against the production build
  AUTH_UNSAFE_TEST_MODE: "1",
  APP_URL: url,
  AUTH_JWT_SECRET: "e2e-secret-e2e-secret-e2e-secret-0123456789",
  AUTH_LIMIT_SIGNIN_IP: "100000",
  AUTH_LIMIT_REGISTER_IP: "100000",
  AUTH_LIMIT_FORGOT_IP: "100000",
  HOSTNAME: "127.0.0.1",
});

const apiHeaders = (url: string) => ({ origin: url, "x-ws-csrf": "1" });

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  // Catalogue pages hydrate a lot of animated components; give slower engines (WebKit) room and cap CI parallelism.
  timeout: 60_000,
  workers: process.env.CI ? 2 : undefined,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL, trace: "retain-on-failure" },
  // Serve the production standalone build (what ships in the Docker image). Run `npm run build` first.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : [
        { command: "npm run start:standalone", url: `${baseURL}/api/health`, reuseExistingServer: !process.env.CI, timeout: 90_000, env: { ...authEnv(baseURL), PORT: String(PORT) } },
        { command: "npm run start:standalone", url: `${shortURL}/api/health`, reuseExistingServer: !process.env.CI, timeout: 90_000,
          env: { ...authEnv(shortURL), PORT: String(SHORT_PORT), AUTH_ACCESS_TTL_SECONDS: "2", AUTH_REFRESH_GRACE_SECONDS: "1", AUTH_RESET_TTL_SECONDS: "2" } },
      ],
  projects: [
    { name: "desktop-chrome", testIgnore: /auth-api/, use: { ...devices["Desktop Chrome"] } },
    { name: "iphone-safari", testIgnore: /auth-api/, use: { ...devices["iPhone 13"] } },
    { name: "android-chrome", testIgnore: /auth-api/, use: { ...devices["Pixel 7"] } },
    { name: "ipad", testIgnore: /auth-api/, use: { ...devices["iPad (gen 7)"] } },
    { name: "auth-api", testMatch: /auth-api\.spec/, use: { baseURL, extraHTTPHeaders: apiHeaders(baseURL) } },
    { name: "auth-api-short-lived", testMatch: /auth-api-short\.spec/, use: { baseURL: shortURL, extraHTTPHeaders: apiHeaders(shortURL) } },
  ],
});
