import { expect } from "@playwright/test";
import type { DataTable } from "playwright-bdd";
import { Given, Then, When } from "./fixtures";

// Notes on step wording (T02): "I open the styleguide" always opens
// the "en" route; "I open the styleguide in {string}" opens the
// given locale's route.
Given("I open the styleguide", async ({ page }) => {
  // Wait for hydration: a hover sent before React attaches the
  // tooltip's pointer handlers is never seen again.
  await page.goto("/en/styleguide", { waitUntil: "networkidle" });
});

When("I open the styleguide in {string}", async ({ page }, locale: string) => {
  await page.goto(`/${locale}/styleguide`);
});

Then("I see these sections in order:", async ({ page }, table: DataTable) => {
  const expectedTitles = table.raw().map(([title]) => title);
  const headings = await page.getByRole("heading", { level: 2 }).allTextContents();

  expect(headings).toEqual(expectedTitles);
});

Given("the viewport is {int} pixels wide", async ({ page }, width: number) => {
  await page.setViewportSize({ width, height: 800 });
});

Then("the page does not scroll horizontally", async ({ page }) => {
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );

  expect(overflows).toBe(false);
});
