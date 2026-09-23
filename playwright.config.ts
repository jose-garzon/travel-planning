import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

const testDir = defineBddConfig({
  features: ["features/**/*.feature", "tests/features/**/*.feature"],
  steps: ["tests/steps/**/*.ts"],
});

const isCI = Boolean(process.env.CI);
const port = 3000;

export default defineConfig({
  testDir,
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
    // SCREENSHOTS=on captures every test for PR evidence.
    screenshot: process.env.SCREENSHOTS === "on" ? "on" : "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: isCI ? "pnpm start" : "pnpm dev",
    port,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
