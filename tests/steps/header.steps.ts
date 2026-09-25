import { expect } from "@playwright/test";
import { Then } from "./fixtures";

// The root header's home link has no message key of its own: its
// accessible name is the wordmark text (plan "Messages").
Then("the header shows the wordmark {string}", async ({ page }, wordmark: string) => {
  const header = page.getByRole("banner");

  await expect(header.getByRole("link", { name: wordmark })).toBeVisible();
});
