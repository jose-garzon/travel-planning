import { randomUUID } from "node:crypto";
import { expect } from "@playwright/test";
import { Given, Then } from "./fixtures";
import { signedInEmail, signInAs } from "./support/session";
import { findTripId, seedMember, seedTrip } from "./support/trips";

Given("I own the trip {string}", async ({ page }, name: string) => {
  const ownerEmail = `jose-${randomUUID().slice(0, 8)}@example.com`;
  await signInAs(page, { email: ownerEmail, displayName: "Jose" });
  await seedTrip({ ownerEmail, name, currency: "USD", legs: [] });
});

Given("{string} and {string} are editors of {string}", async ({ page }, first, second, name) => {
  const tripId = await findTripId(signedInEmail(page), name);
  await seedMember({ tripId, name: first, role: "editor" });
  await seedMember({ tripId, name: second, role: "editor" });
});

Given("{string} is an editor of {string}", async ({ page }, name: string, tripName: string) => {
  const tripId = await findTripId(signedInEmail(page), tripName);
  await seedMember({ tripId, name, role: "editor" });
});

/** The travelers, in the order the list shows them (feature 009 AC-8). */
function travelerItems(page: import("@playwright/test").Page) {
  return page.getByRole("region", { name: "Travelers" }).getByRole("listitem");
}

Then("the travelers list shows {string}", async ({ page }, names: string) => {
  const expected = names.split(", ").map((name) => new RegExp(name));
  await expect(travelerItems(page)).toHaveText(expected);
});

Then("the travelers list shows {string} in that order", async ({ page }, names: string) => {
  const expected = names.split(", ").map((name) => new RegExp(name));
  await expect(travelerItems(page)).toHaveText(expected);
});

Then("{string} is marked as the owner", async ({ page }, name: string) => {
  const row = travelerItems(page).filter({ hasText: name });
  await expect(row.getByText("Owner", { exact: true })).toBeVisible();
});

Then("the traveler {string} is listed by full name", async ({ page }, name: string) => {
  await expect(page.getByRole("region", { name: "Travelers" }).getByText(name)).toBeVisible();
});
