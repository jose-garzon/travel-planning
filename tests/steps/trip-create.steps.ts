import { expect } from "@playwright/test";
import { Given, Then, When } from "./fixtures";

Given("my browser language is {string}", async ({ page }, language: string) => {
  // Replaces what `navigator.language(s)` reports before any page script
  // runs; the app's own locale routing is unaffected.
  await page.addInitScript((tag) => {
    Object.defineProperty(navigator, "language", { get: () => tag });
    Object.defineProperty(navigator, "languages", { get: () => [tag] });
  }, language);
});

When("I start a new trip", async ({ page }) => {
  await page.goto("/trips/new");
});

When("I name the trip {string}", async ({ page }, name: string) => {
  await page.getByLabel("Trip name").fill(name);
});

When(
  "I set leg {int} from {string} to {string}",
  async ({ page }, legNumber: number, from: string, to: string) => {
    const leg = page.getByRole("group", { name: `Stop ${legNumber}` });
    await leg.getByLabel("From", { exact: true }).fill(from);
    await leg.getByLabel("To", { exact: true }).fill(to);
  },
);

When("I create the trip", async ({ page }) => {
  await page.getByRole("button", { name: "Create trip" }).click();
});

Then("the currency is {string}", async ({ page }, currency: string) => {
  await expect(page.getByRole("combobox", { name: "Currency" })).toHaveValue(currency);
});

Then("focus is on the field {string}", async ({ page }, label: string) => {
  await expect(page.getByLabel(label)).toBeFocused();
});
