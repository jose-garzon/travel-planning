import { expect } from "@playwright/test";
import { Then, When } from "./fixtures";
import { signedInEmail } from "./support/session";
import { bumpTripVersion, findTripId } from "./support/trips";

When("I open the trip {string}", async ({ page }, name: string) => {
  const id = await findTripId(signedInEmail(page), name);
  await page.goto(`/trips/${id}`);
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
