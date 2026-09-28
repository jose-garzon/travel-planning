import { expect } from "@playwright/test";
import { Given, Then, When } from "./fixtures";

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
