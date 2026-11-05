import { createClient } from "@libsql/client";
import { expect, type Page } from "@playwright/test";
import { Then, When } from "./fixtures";
import { ownerEmailFor } from "./support/owners";
import { openTravelers } from "./support/travelers";
import { findTripId } from "./support/trips";

// Plain SQL, like support/trips.ts: these steps run in Playwright's Node process.
const client = createClient({
  url: process.env.DATABASE_URL ?? "file:local.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

/** The last API answer per page, for the "answers 403" check. */
const lastApiAnswer = new WeakMap<Page, { status: number; code: string | undefined }>();

function inviteLink(page: Page) {
  return page.getByRole("textbox", { name: "Invite link" });
}

/**
 * The trip the outline acts on: every API scenario has one trip, "Europe",
 * owned by the registered owner (feature 009 T07 "Editor cannot call owner actions").
 */
const OUTLINE_TRIP = "Europe";

async function outlineTripId(page: Page): Promise<string> {
  return findTripId(ownerEmailFor(page, OUTLINE_TRIP), OUTLINE_TRIP);
}

async function userIdOf(email: string): Promise<string> {
  const found = await client.execute({
    sql: "SELECT id FROM user WHERE email = ?",
    args: [email],
  });
  const id = found.rows[0]?.id;
  if (typeof id !== "string") {
    throw new Error(`no user with email ${email}`);
  }
  return id;
}

async function recordAnswer(page: Page, response: { status(): number; text(): Promise<string> }) {
  const body = await response.text();
  let code: string | undefined;
  if (body.length > 0) {
    code = (JSON.parse(body) as { error?: { code?: string } }).error?.code;
  }
  lastApiAnswer.set(page, { status: response.status(), code });
}

When("I delete the trip through the API", async ({ page }) => {
  const id = await outlineTripId(page);
  await recordAnswer(page, await page.request.delete(`/api/v1/trips/${id}`));
});

When("I get the invite link through the API", async ({ page }) => {
  const id = await outlineTripId(page);
  await recordAnswer(page, await page.request.post(`/api/v1/trips/${id}/invite`));
});

When("I reset the invite link through the API", async ({ page }) => {
  const id = await outlineTripId(page);
  await recordAnswer(page, await page.request.post(`/api/v1/trips/${id}/invite/reset`));
});

// The outline removes the owner ("Jose"), whose account is the registered owner.
When("I remove {string} through the API", async ({ page }, _name: string) => {
  const id = await outlineTripId(page);
  const userId = await userIdOf(ownerEmailFor(page, OUTLINE_TRIP));
  await recordAnswer(page, await page.request.delete(`/api/v1/trips/${id}/members/${userId}`));
});

Then("the API answers {int} {string}", async ({ page }, status: number, code: string) => {
  const answer = lastApiAnswer.get(page);
  expect(answer, "no API call was made in this scenario").toBeDefined();
  expect(answer).toEqual({ status, code });
});

When("I create the trip {string}", async ({ page }, name: string) => {
  await page.goto("/trips/new");
  await page.getByLabel("Trip name").fill(name);
  const leg = page.getByRole("group", { name: "Leg 1" });
  await leg.getByLabel("From", { exact: true }).fill("Bogotá");
  await leg.getByLabel("To", { exact: true }).fill("Madrid");
  await page.getByRole("button", { name: "Create trip" }).click();
});

When("I choose {string} in the toast", async ({ page }, action: string) => {
  await page.getByRole("link", { name: action, exact: true }).click();
});

Then("I am on the trip page of {string}", async ({ page }, name: string) => {
  const id = await findTripId(ownerEmailFor(page, name), name);
  await expect(page).toHaveURL(new RegExp(`/trips/${id}(\\?|$)`));
});

When("I go offline", async ({ page }) => {
  await page.context().setOffline(true);
});

Then("I can still copy the invite link", async ({ page }) => {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  const copy = page.getByRole("button", { name: "Copy link", exact: true });
  await expect(copy).toBeEnabled();
  await copy.click();
  await expect(page.getByRole("status").filter({ hasText: "Copied" })).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toBe(await inviteLink(page).inputValue());
});

Then("reset and remove are disabled with an offline note", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Reset link", exact: true })).toBeDisabled();
  await openTravelers(page);
  // The open invite dialog is modal: Radix hides the travelers list from the
  // accessibility tree, so the Remove button is only reachable with includeHidden.
  const remove = page
    .getByRole("region", { name: "Travelers", includeHidden: true })
    .getByRole("listitem", { includeHidden: true })
    .getByRole("button", { name: "Remove", exact: true, includeHidden: true });
  await expect(remove).toBeDisabled();
  await expect(page.getByText(/offline/i).first()).toBeVisible();
});
