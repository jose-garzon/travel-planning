import { createClient } from "@libsql/client";
import { expect } from "@playwright/test";
import { Given, Then, When } from "./fixtures";
import { ownerEmailFor } from "./support/owners";
import { signedInEmail } from "./support/session";
import { openTripEditor } from "./support/trip-editor";
import { findTripId } from "./support/trips";

// Plain SQL, like support/trips.ts: these steps run in Playwright's Node process.
const client = createClient({
  url: process.env.DATABASE_URL ?? "file:local.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const busyTimeoutReady = client.execute("PRAGMA busy_timeout = 5000;");

const CONFLICT_MESSAGE = "This trip changed. Reload to see the latest.";

Then(
  "I see no {string}, {string} or {string} controls",
  async ({ page }, first: string, second: string, third: string) => {
    // Invite and Remove live on the trip page; Delete on its edit page.
    const none = async () => {
      for (const name of [first, second, third]) {
        await expect(page.getByRole("button", { name, exact: true })).toHaveCount(0);
      }
    };
    await expect(page.getByRole("link", { name: "Edit trip" })).toBeVisible();
    await none();
    await openTripEditor(page);
    await expect(page.getByRole("button", { name: "Save changes" })).toBeVisible();
    await none();
  },
);

When("I rename the trip to {string} and save", async ({ page }, name: string) => {
  await openTripEditor(page);
  await page.getByLabel("Trip name").fill(name);
  await page.getByRole("button", { name: "Save changes" }).click();
});

Then("the trip is named {string}", async ({ page }, name: string) => {
  await expect(page.getByText(name, { exact: true })).toBeVisible();
});

Given("I opened the trip {string}", async ({ page }, name: string) => {
  const id = await findTripId(signedInEmail(page), name);
  await page.goto(`/trips/${id}`);
  await openTripEditor(page);
  await expect(page.getByRole("button", { name: "Save changes" })).toBeVisible();
});

// The signed-in member is the one removed: "Laura" in the scenarios. The trip
// is found through its owner: a removed member is no longer on it, so the
// session cannot find it (feature 009 D-9).
Given("{string} was removed from {string}", async ({ page }, _name: string, tripName: string) => {
  const tripId = await findTripId(ownerEmailFor(page, tripName), tripName);
  await busyTimeoutReady;
  await client.execute({
    sql: "DELETE FROM trip_member WHERE trip_id = ? AND user_id = (SELECT id FROM user WHERE email = ?)",
    args: [tripId, signedInEmail(page)],
  });
});

// Another member's save: the name changes and the version moves on.
Given(
  "{string} renamed {string} to {string}",
  async ({ page }, _ownerName: string, from: string, to: string) => {
    const tripId = await findTripId(signedInEmail(page), from);
    await busyTimeoutReady;
    await client.execute({
      sql: "UPDATE trip SET name = ?, version = version + 1 WHERE id = ?",
      args: [to, tripId],
    });
  },
);

Then("I see the version conflict message", async ({ page }) => {
  // The route announcer is also an alert, so match the message itself.
  await expect(page.getByRole("alert").filter({ hasText: CONFLICT_MESSAGE })).toBeVisible();
});

Then("I am on my home page with {string}", async ({ page }, text: string) => {
  // The locale prefix is in the URL (`/en?removed=1`).
  await expect(page).toHaveURL(/\/(en|es)?(\?.*)?$/);
  await expect(page.getByText(text)).toBeVisible();
});
