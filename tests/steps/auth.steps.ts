import { createClient } from "@libsql/client";
import { expect } from "@playwright/test";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { verification } from "@/shared/db/schema/auth";
import { Given, Then, When } from "./fixtures";

// A plain Drizzle/libsql client, not `shared/db/client.ts`: that file
// (and `shared/config/env.ts`) imports `server-only`, which throws
// outside a Next.js server bundle — this step file runs in plain Node
// (Playwright's runner), same reasoning as the `*.integration.test.ts`
// files' `vi.mock("server-only", ...)`, just without vitest's mocking
// available here. Same `DATABASE_URL` default as `env.ts`, so this
// points at the same local SQLite file the `pnpm dev` server (started
// by Playwright's `webServer`, same shell env) uses.
//
// `fullyParallel` (playwright.config.ts) runs scenarios in several
// worker processes, each opening its own connection to that one local
// file; SQLite's default rollback-journal mode needs an exclusive lock
// per write, so concurrent writers otherwise fail with
// `SQLITE_BUSY: database is locked`. WAL lets readers and a writer
// coexist, and `busy_timeout` makes a blocked writer wait its turn
// instead of erroring immediately.
let testDbPromise: ReturnType<typeof initTestDb> | null = null;

async function initTestDb() {
  const client = createClient({ url: process.env.DATABASE_URL ?? "file:local.db" });
  await client.execute("PRAGMA journal_mode = WAL;");
  await client.execute("PRAGMA busy_timeout = 5000;");
  return drizzle(client, { schema: { verification } });
}

function getTestDb() {
  testDbPromise ??= initTestDb();
  return testDbPromise;
}

// Set by the cooldown-seeding `Given` right below, read by the shared
// "I request a magic link" `When` right after it in the same
// scenario: skips that `When`'s own cleanup so it does not erase the
// count the `Given` just seeded (Cucumber always runs a scenario's
// steps one at a time, in order, so this is safe across scenarios).
let skipNextRequestCleanup = false;

Given("I am a visitor with no account", async ({ page }) => {
  // Each scenario sets up its own data (testing.md); a fresh context
  // already has no session, cleared explicitly so this step documents
  // that intent instead of relying on it silently.
  await page.context().clearCookies();
});

When("I open the site", async ({ page }) => {
  await page.goto("/");
});

Then("I see the landing page with a hero and an email field", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("textbox")).toBeVisible();
});

// Shared generic assertion (@T01/@T02/@T03 all use this exact Gherkin
// phrase for a plain visible-text check): substring, whitespace
// normalized, same as `common.steps.ts`'s "I see the text {string}".
Then("I see {string}", async ({ page }, text: string) => {
  await expect(page.getByText(text)).toBeVisible();
});

Then("I see the error {string}", async ({ page }, text: string) => {
  await expect(page.getByText(text)).toBeVisible();
});

When("I request a magic link for {string}", async ({ page }, email: string) => {
  if (skipNextRequestCleanup) {
    skipNextRequestCleanup = false;
  } else {
    // Deterministic count (testing.md "no order dependence"): other
    // @T01 scenarios also send real magic links for this fixture
    // email, so a plain happy-path request must not inherit their
    // leftover rows.
    const testDb = await getTestDb();
    await testDb.delete(verification).where(eq(verification.identifier, email));
  }

  await page.goto("/");
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("button", { name: "Continue" }).click();
});

Then("I see my email {string} on the screen", async ({ page }, email: string) => {
  await expect(page.getByText(email)).toBeVisible();
});

Then("focus stays on the email field", async ({ page }) => {
  await expect(page.getByRole("textbox", { name: "Email" })).toBeFocused();
});

Then("no magic link is sent", async ({ page }) => {
  // AC-9: an invalid format never reaches Better Auth's endpoint, so
  // the success confirmation (shown only after a real send resolves)
  // never appears and the form stays in place.
  await expect(page.getByText("Check your email for a sign-in link")).not.toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
});

Then("my email {string} is still in the field", async ({ page }, email: string) => {
  await expect(page.getByRole("textbox", { name: "Email" })).toHaveValue(email);
});

// Simulates the email provider failing (AC-12) by intercepting Better
// Auth's own conventional route at the network layer instead of
// adding a fault switch to production sender code (plan.md D-1: same
// mounted `/api/auth/[...all]` route; there is no test-only seeding
// surface in this repo to trigger a real provider outage from here).
Given("the email provider is failing", async ({ page }) => {
  await page.route("**/api/auth/sign-in/magic-link", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ code: "INTERNAL_SERVER_ERROR", message: "Failed to send email" }),
    });
  });
});

// Seeds `verification` rows directly (no test-only HTTP seeding
// endpoint in this repo, testing.md): the cooldown check counts rows
// Better Auth itself writes for `identifier` (email), D-3.
Given(
  // The outline's `<previous>` sits inside quotes in the scenario
  // template (tests.feature), so the rendered step is `"2"`/`"3"` —
  // `{string}`, not `{int}` (which expects a bare, unquoted number).
  "I requested {string} magic links for {string} within 15 minutes",
  // biome-ignore lint/correctness/noEmptyPattern: playwright-bdd requires this exact destructuring signature.
  async ({}, previousText: string, email: string) => {
    const previous = Number(previousText);
    const testDb = await getTestDb();

    // Deletes first (testing.md "no order dependence"): other @T01
    // scenarios send real magic links for this same fixture email, so
    // this seed is not additive to whatever ran before it.
    await testDb.delete(verification).where(eq(verification.identifier, email));

    const now = new Date();
    const rows = Array.from({ length: previous }, (_unused, index) => ({
      id: `test-verification-${email}-${index}-${now.getTime()}`,
      identifier: email,
      value: `test-token-${index}`,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + 15 * 60 * 1000),
    }));

    if (rows.length > 0) {
      await testDb.insert(verification).values(rows);
    }

    skipNextRequestCleanup = true;
  },
);

Given(
  "I requested a magic link for {string} and did not click it",
  async ({ page }, email: string) => {
    // Same reasoning as the cooldown seed above: a real send, so it
    // must not inherit another scenario's leftover cooldown count for
    // this fixture email.
    const testDb = await getTestDb();
    await testDb.delete(verification).where(eq(verification.identifier, email));

    await page.goto("/");
    await page.getByRole("textbox", { name: "Email" }).fill(email);
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText(email)).toBeVisible();
  },
);

When("I open the site again", async ({ page }) => {
  await page.reload();
});
