import { expect } from "@playwright/test";
import type { DataTable } from "playwright-bdd";
import { Given, Then, When } from "./fixtures";
import { ownerEmailFor } from "./support/owners";
import { signedInEmail } from "./support/session";
import { openTripEditor } from "./support/trip-editor";
import { bumpTripVersion, findTripId, seedTrip } from "./support/trips";

Given("I have a trip {string} with route:", async ({ page }, name: string, table: DataTable) => {
  await seedTrip({
    ownerEmail: signedInEmail(page),
    name,
    currency: "USD",
    legs: table.hashes().map((row) => ({
      from: row.from as string,
      to: row.to as string,
      dayOffset: Number(row.day),
    })),
  });
});

// Found through the owner, not the session: a removed member is no longer
// on the trip (feature 009 D-9).
When("I open the trip {string}", async ({ page }, name: string) => {
  const id = await findTripId(ownerEmailFor(page, name), name);
  await page.goto(`/trips/${id}`);
});

When("I edit the trip {string}", async ({ page }, name: string) => {
  const id = await findTripId(ownerEmailFor(page, name), name);
  await page.goto(`/trips/${id}`);
  await openTripEditor(page);
});

When("someone else changes the trip {string}", async ({ page }, name: string) => {
  await bumpTripVersion(await findTripId(signedInEmail(page), name));
});

When("I save the changes", async ({ page }) => {
  await page.getByRole("button", { name: "Save changes" }).click();
});

When("I delete the trip and confirm", async ({ page }) => {
  await page.getByRole("button", { name: "Delete trip" }).click();
  const dialog = page.getByRole("dialog", { name: "Delete this trip?" });
  await dialog.getByRole("button", { name: "Delete", exact: true }).click();
});

When("I go back to the home page", async ({ page }) => {
  await page.getByRole("link", { name: "Cancel" }).click();
});

Then("I see the dialog {string}", async ({ page }, name: string) => {
  await expect(page.getByRole("dialog", { name })).toBeVisible();
});

Then("I do not see {string} on the home page", async ({ page }, text: string) => {
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText(text)).toHaveCount(0);
});
