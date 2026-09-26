import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

const testDir = defineBddConfig({
  features: ["features/**/*.feature", "tests/features/**/*.feature"],
  steps: ["tests/steps/**/*.ts"],
  // Tasks land one at a time; scenarios for later tasks have no step
  // definitions yet. Fail the scenario at run time instead of
  // aborting the whole bddgen run.
  missingSteps: "fail-on-run",
});

const isCI = Boolean(process.env.CI);
// Each /feat-apply worktree (.worktrees/T06) gets its own dev server
// port, so parallel tasks never reuse another task's server.
const worktreeTask = /[\\/]\.worktrees[\\/]T(\d+)/.exec(process.cwd())?.[1];
const port = Number(process.env.PORT ?? (worktreeTask ? 3100 + Number(worktreeTask) : 3000));

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
    // Pixel 7 is touch: scenarios needing a mouse hover are @desktop.
    { name: "mobile", use: { ...devices["Pixel 7"] }, grepInvert: /@desktop/ },
  ],
  webServer: {
    command: `${isCI ? "pnpm start" : "pnpm dev"} --port ${port}`,
    port,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
