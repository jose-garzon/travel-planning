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
  // `false` (Playwright's own default) keeps a feature's scenarios in
  // their generated `tests.feature.spec.js` file running in order, in
  // one worker; different feature files still run in parallel with
  // each other. Some scenarios share real, out-of-band server state
  // (Better Auth's `verification` table, keyed by a fixed test email
  // reused across many scenarios in one feature file, e.g. the
  // magic-link cooldown, testing.md "no order dependence" applies
  // *within* a feature, not to concurrent execution across its own
  // scenarios). `true` schedules individual tests across workers
  // regardless of file, so those scenarios raced each other and
  // corrupted that shared state (e.g. one scenario's cooldown-count
  // seed rows were still visible to another's unrelated request for
  // the same email, wrongly cooling it down).
  fullyParallel: false,
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
