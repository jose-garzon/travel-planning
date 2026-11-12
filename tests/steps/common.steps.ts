import { expect } from "@playwright/test";
import { Given, Then } from "./fixtures";

Given("my locale is {string}", async ({ page }, locale: string) => {
  await page.goto(`/${locale}`);
});

Given("I open the home page", async ({ page }) => {
  await page.goto("/");
});

Then("I see the heading {string}", async ({ page }, name: string) => {
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
});

Then("I see the text {string}", async ({ page }, text: string) => {
  await expect(page.getByText(text)).toBeVisible();
});

Then("the page has no accessibility violations", async ({ page, axe }) => {
  // Next streams metadata: the <title> can land after the body, so scan
  // once it is there, or axe reports a missing title that users never see.
  await expect(page).toHaveTitle(/\S/);
  const violations = await axe();
  expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});
