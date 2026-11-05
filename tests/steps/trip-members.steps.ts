import { randomUUID } from "node:crypto";
import { createClient } from "@libsql/client";
import { expect } from "@playwright/test";
import { Given, Then } from "./fixtures";
import { ownerEmailFor, registerOwner } from "./support/owners";
import { signedInEmail, signInAs } from "./support/session";
import { openTravelers } from "./support/travelers";
import { findTripId, seedMember, seedTrip } from "./support/trips";

Given("I own the trip {string}", async ({ page }, name: string) => {
  const ownerEmail = `jose-${randomUUID().slice(0, 8)}@example.com`;
  await signInAs(page, { email: ownerEmail, displayName: "Jose" });
  registerOwner(page, name, ownerEmail);
  await seedTrip({ ownerEmail, name, currency: "USD", legs: [] });
});

Given("{string} owns the trip {string}", async ({ page }, ownerName: string, name: string) => {
  const ownerEmail = `${ownerName.toLowerCase()}-${randomUUID().slice(0, 8)}@example.com`;
  await signInAs(page, { email: ownerEmail, displayName: ownerName });
  registerOwner(page, name, ownerEmail);
  // A route is needed to save: the form blocks a trip with no origin.
  await seedTrip({
    ownerEmail,
    name,
    currency: "USD",
    legs: [{ from: "Bogota", to: "Madrid" }],
  });
});

Given("{string} and {string} are editors of {string}", async ({ page }, first, second, name) => {
  const tripId = await findTripId(ownerEmailFor(page, name), name);
  await seedMember({ tripId, name: first, role: "editor" });
  await seedMember({ tripId, name: second, role: "editor" });
});

// Plain SQL, like support/trips.ts: these steps run in Playwright's Node process.
const client = createClient({
  url: process.env.DATABASE_URL ?? "file:local.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const busyTimeoutReady = client.execute("PRAGMA busy_timeout = 5000;");

Given("{string} is an editor of {string}", async ({ page }, name: string, tripName: string) => {
  const tripId = await findTripId(ownerEmailFor(page, tripName), tripName);
  // When the editor is the member signed in on this page, join that user: a
  // second user row with the same name would not be the signed-in member.
  const signedIn = await client.execute({
    sql: "SELECT id, name FROM user WHERE email = ?",
    args: [signedInEmail(page)],
  });
  const self = signedIn.rows[0];
  if (self?.name === name && typeof self.id === "string") {
    await busyTimeoutReady;
    await client.execute({
      sql: "INSERT INTO trip_member (trip_id, user_id, role, joined_at) VALUES (?, ?, 'editor', ?)",
      args: [tripId, self.id, Date.now()],
    });
    return;
  }
  await seedMember({ tripId, name, role: "editor" });
});

/** The travelers, in the order the list shows them (feature 009 AC-8). */
function travelerItems(page: import("@playwright/test").Page) {
  return page.getByRole("region", { name: "Travelers" }).getByRole("listitem");
}

Then("the travelers list shows {string}", async ({ page }, names: string) => {
  const expected = names.split(", ").map((name) => new RegExp(name));
  await openTravelers(page);
  await expect(travelerItems(page)).toHaveText(expected);
});

Then("the travelers list shows {string} in that order", async ({ page }, names: string) => {
  const expected = names.split(", ").map((name) => new RegExp(name));
  await openTravelers(page);
  await expect(travelerItems(page)).toHaveText(expected);
});

Then("{string} is marked as the owner", async ({ page }, name: string) => {
  await openTravelers(page);
  const row = travelerItems(page).filter({ hasText: name });
  await expect(row.getByText("Owner", { exact: true })).toBeVisible();
});

Then("the traveler {string} is listed by full name", async ({ page }, name: string) => {
  await openTravelers(page);
  await expect(page.getByRole("region", { name: "Travelers" }).getByText(name)).toBeVisible();
});
