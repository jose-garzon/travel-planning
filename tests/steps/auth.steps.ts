import type { APIRequestContext, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { eq, sql } from "drizzle-orm";
import { Given, Then, When } from "./fixtures";
import { user, verification, withTestDb } from "./support/db";

const MAGIC_LINK_EXPIRY_MINUTES = 15;

// `desktop` and `mobile` (playwright.config.ts projects) run the same
// scenarios concurrently against the one shared dev server and
// `local.db`. None of @T02's scenarios, nor @T01's cooldown outline,
// ever display the literal email on screen (unlike a couple of @T01's
// other scenarios — those stay untouched, calling neither this nor
// the functions built on it), so every email they touch is scoped to
// the running project first, keeping the two projects' users/tokens/
// cooldown-counts independent instead of racing each other for the
// same literal fixture address (e.g. "ana@example.com", reused
// verbatim across scenarios in the locked tests.feature).
function projectScoped(email: string): string {
  const [localPart, domain] = email.split("@");
  return `${localPart}+${test.info().project.name}@${domain}`;
}

async function requestMagicLink(request: APIRequestContext, email: string): Promise<void> {
  const scopedEmail = projectScoped(email);
  // Clears any prior `verification` rows for this (project-scoped)
  // email first (testing.md "no order dependence"): other scenarios —
  // including @T01's cooldown outline, which deliberately leaves 3+
  // recent rows behind — reuse the same literal fixture email, so a
  // guaranteed-successful send must not inherit their leftover rows.
  await deleteVerificationRowsForEmail(scopedEmail);
  const response = await request.post("/api/auth/sign-in/magic-link", {
    data: { email: scopedEmail },
  });
  expect(response.ok()).toBe(true);
}

/**
 * Reads the plain-text token Better Auth stored for the most recent
 * magic-link request to `email` (`verification.identifier`; the
 * plugin's default `storeToken: "plain"`, per
 * `node_modules/better-auth/dist/plugins/magic-link`, means it is the
 * exact value the emailed link's `?token=` carries).
 */
async function readLatestMagicLinkToken(email: string): Promise<string> {
  const scopedEmail = projectScoped(email);
  const testDb = await withTestDb();
  const rows = await testDb.select().from(verification);
  const matches = rows.filter((row) => JSON.parse(row.value).email === scopedEmail);
  const latest = matches.reduce((newest, row) => (row.createdAt > newest.createdAt ? row : newest));
  return latest.identifier;
}

async function expireLatestMagicLinkToken(email: string): Promise<void> {
  const testDb = await withTestDb();
  const token = await readLatestMagicLinkToken(email);
  const expiresAt = new Date(Date.now() - (MAGIC_LINK_EXPIRY_MINUTES + 1) * 60 * 1000);
  await testDb.update(verification).set({ expiresAt }).where(eq(verification.identifier, token));
}

// Deletes every `verification` row for `email`, matched the same way
// the real rows are shaped: `identifier` is the issued token (never
// the email, see `readLatestMagicLinkToken` above), so the email only
// ever lives inside the JSON `value` column. Used to reset a fixture
// email's magic-link history between scenarios/reruns (testing.md "no
// order dependence") — matching on `identifier` here would silently
// never delete a single real row.
async function deleteVerificationRowsForEmail(email: string): Promise<void> {
  const testDb = await withTestDb();
  await testDb
    .delete(verification)
    .where(sql`json_extract(${verification.value}, '$.email') = ${email}`);
}

// Emails in the human-authored `tests.feature` repeat across scenarios
// (e.g. "ana@example.com"), and `local.db` is a persistent file, not
// reset between test runs (testing.md: each scenario still sets up its
// own data — a rerun must land in the same state, not collide with a
// leftover row from a previous run). Upsert on the unique `email`
// column instead of a plain insert.
async function seedExistingMember(email: string, name: string): Promise<void> {
  const testDb = await withTestDb();
  const now = new Date();
  await testDb
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      name,
      email: projectScoped(email),
      emailVerified: true,
      nameConfirmedAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: user.email,
      set: { name, nameConfirmedAt: now, updatedAt: now },
    });
}

function magicLinkVerifyPath(token: string): string {
  return `/api/auth/magic-link/verify?${new URLSearchParams({ token, callbackURL: "/" })}`;
}

async function isSignedIn(page: Page): Promise<boolean> {
  const cookies = await page.context().cookies();
  return cookies.some((cookie) => cookie.name.includes("session_token"));
}

// playwright-bdd has no Cucumber "World"; each scenario runs as its
// own Playwright test (sequential within a worker, isolated across
// workers), so a module-level variable carries state between this
// scenario's own Given/When/Then safely.
let deviceEmail: string | undefined;
let expiredLinkEmail: string | undefined;
let returningMemberEmail: string | undefined;
let secondDevicePage: Page | undefined;

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

// --- @T02: verify a magic link (create/reuse account, expiry, name capture) ---

Given("no account exists yet for {string}", async ({ page }, _email: string) => {
  await page.context().clearCookies();
});

Given("an account already exists for {string}", async ({ page }, email: string) => {
  await page.context().clearCookies();
  await seedExistingMember(email, "Ana");
});

When("I open the magic link sent to {string}", async ({ page, request }, email: string) => {
  await requestMagicLink(request, email);
  const token = await readLatestMagicLinkToken(email);
  await page.goto(magicLinkVerifyPath(token));
});

Then("I am signed in", async ({ page }) => {
  expect(await isSignedIn(page)).toBe(true);
});

Given("I requested a magic link for {string} on one device", async ({ request }, email: string) => {
  deviceEmail = email;
  await requestMagicLink(request, email);
});

When("I open that magic link on a different device", async ({ browser }) => {
  if (deviceEmail === undefined) {
    throw new Error("no magic link was requested for a device");
  }
  const token = await readLatestMagicLinkToken(deviceEmail);
  const otherDevice = await browser.newContext();
  secondDevicePage = await otherDevice.newPage();
  await secondDevicePage.goto(magicLinkVerifyPath(token));
});

Then("I am signed in on that device", async () => {
  if (secondDevicePage === undefined) {
    throw new Error("no second device page was opened");
  }
  expect(await isSignedIn(secondDevicePage)).toBe(true);
});

Given(
  "my magic link for {string} is more than 15 minutes old",
  async ({ page, request }, email: string) => {
    await page.context().clearCookies();
    expiredLinkEmail = email;
    await requestMagicLink(request, email);
    await expireLatestMagicLinkToken(email);
  },
);

When("I open that magic link", async ({ page }) => {
  if (expiredLinkEmail === undefined) {
    throw new Error("no magic link was requested");
  }
  const token = await readLatestMagicLinkToken(expiredLinkEmail);
  await page.goto(magicLinkVerifyPath(token));
});

Then("I see a button to send a new link", async ({ page }) => {
  await expect(page.getByRole("button", { name: /send a new link/i })).toBeVisible();
});

Given("I just verified my magic link for the first time", async ({ page, request }) => {
  const email = `${crypto.randomUUID()}@example.com`;
  await requestMagicLink(request, email);
  const token = await readLatestMagicLinkToken(email);
  await page.goto(magicLinkVerifyPath(token));
  await expect(page.getByRole("textbox", { name: /name/i })).toBeVisible();
});

When("I submit {string} as my name", async ({ page }, name: string) => {
  await page.getByRole("textbox", { name: /name/i }).fill(name);
  await page.getByRole("button", { name: /continue/i }).click();
});

Then("I see the home page", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("textbox", { name: /name/i })).toHaveCount(0);
});

Given(
  "I am signed in as {string} who already has a name on file",
  async ({ page }, name: string) => {
    const email = `${crypto.randomUUID()}@example.com`;
    returningMemberEmail = email;
    await page.context().clearCookies();
    await seedExistingMember(email, name);
  },
);

When("I verify a new magic link", async ({ page, request }) => {
  if (returningMemberEmail === undefined) {
    throw new Error("no returning member was seeded");
  }
  await requestMagicLink(request, returningMemberEmail);
  const token = await readLatestMagicLinkToken(returningMemberEmail);
  await page.goto(magicLinkVerifyPath(token));
});

Then("I see the home page directly, with no name form", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("textbox", { name: /name/i })).toHaveCount(0);
});

Then("focus moves to the page's heading", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
});

// --- @T01: request a magic link (happy path, invalid email, send failure, cooldown) ---

// Shared generic assertion (@T01/@T02/@T03 all use this exact Gherkin
// phrase for a plain visible-text check): substring, whitespace
// normalized, same as `common.steps.ts`'s "I see the text {string}".
Then("I see {string}", async ({ page }, text: string) => {
  await expect(page.getByText(text)).toBeVisible();
});

Then("I see the error {string}", async ({ page }, text: string) => {
  await expect(page.getByText(text)).toBeVisible();
});

// Set by the cooldown-seeding `Given` right below when it wants the
// paired "I request a magic link" `When` to target the exact same
// (possibly project-qualified, see that `Given`'s comment) email it
// just seeded, instead of the literal string Gherkin passed it.
let cooldownFlowEmail: string | undefined;

When("I request a magic link for {string}", async ({ page }, email: string) => {
  let targetEmail = email;

  if (skipNextRequestCleanup) {
    skipNextRequestCleanup = false;
    if (cooldownFlowEmail !== undefined) {
      targetEmail = cooldownFlowEmail;
      cooldownFlowEmail = undefined;
    }
  } else {
    // Deterministic count (testing.md "no order dependence"): other
    // @T01 scenarios also send real magic links for this fixture
    // email, so a plain happy-path request must not inherit their
    // leftover rows.
    await deleteVerificationRowsForEmail(targetEmail);
  }

  await page.goto("/");
  await page.getByRole("textbox", { name: "Email" }).fill(targetEmail);
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
// endpoint in this repo, testing.md): the cooldown check counts real
// rows Better Auth itself writes for the email, D-3. Shaped like the
// plugin's actual output (`identifier` is a fake token, `value` is
// JSON with the email inside) — not `identifier: email` — so this
// seed exercises the same shape `countRecent` really queries instead
// of merely being self-consistent with a wrong assumption.
//
// Deliberately pushes this email's recent-request count right up to
// (and, in the Example that expects a block, past) the cooldown
// threshold — the one @T01 flow that's genuinely sensitive to another
// concurrent run touching the same literal fixture email. `desktop`
// and `mobile` (playwright.config.ts projects) both run this same
// scenario against the one shared dev server/`local.db`, concurrently
// (no `@desktop` tag here to run it on just one, and the scenario
// can't be edited to add one, testing.md "locked after red") — so a
// per-project email suffix keeps the two projects' cooldown counters
// independent instead of racing each other. Not shown anywhere this
// scenario asserts on screen (only generic "check your email"/"too
// many requests" text), so changing the literal value is safe here
// specifically.
Given(
  // The outline's `<previous>` sits inside quotes in the scenario
  // template (tests.feature), so the rendered step is `"2"`/`"3"` —
  // `{string}`, not `{int}` (which expects a bare, unquoted number).
  "I requested {string} magic links for {string} within 15 minutes",
  // biome-ignore lint/correctness/noEmptyPattern: playwright-bdd requires this exact destructuring signature.
  async ({}, previousText: string, emailFromGherkin: string) => {
    const previous = Number(previousText);
    const testDb = await withTestDb();
    const email = projectScoped(emailFromGherkin);
    cooldownFlowEmail = email;

    // Deletes first (testing.md "no order dependence"): other @T01
    // scenarios send real magic links for this same fixture email, so
    // this seed is not additive to whatever ran before it.
    await deleteVerificationRowsForEmail(email);

    const now = new Date();
    const rows = Array.from({ length: previous }, (_unused, index) => ({
      id: `test-verification-${email}-${index}-${now.getTime()}`,
      identifier: `test-token-${email}-${index}-${now.getTime()}`,
      value: JSON.stringify({ email, name: null }),
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
    await deleteVerificationRowsForEmail(email);

    await page.goto("/");
    await page.getByRole("textbox", { name: "Email" }).fill(email);
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText(email)).toBeVisible();
  },
);

When("I open the site again", async ({ page }) => {
  await page.reload();
});
