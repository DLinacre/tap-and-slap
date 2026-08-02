import { defineConfig, devices } from "playwright/test";

/**
 * E2E: one smoke suite — the game boots, autoplay mode plays a short QA run
 * and the results screen appears. Requires the DB seeded (CI does db push + seed).
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    // E2E runs against the production build (matches CI order: build → e2e).
    // Locally: `npm run build && npm run test:e2e`.
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
