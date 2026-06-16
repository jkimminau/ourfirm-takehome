import { defineConfig } from "@playwright/test";

// End-to-end happy path against the running app. Starts `npm run dev` (web +
// server) automatically. Requires browsers once: `npx playwright install chromium`.
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
