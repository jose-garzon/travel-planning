import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { Then, When } from "./fixtures";
import { openTravelers } from "./support/travelers";

/** The travelers list (desktop: the card is always open). */
function travelers(page: Page) {
  return page.getByRole("region", { name: "Travelers" }).getByRole("listitem");
}

When("I remove {string} and confirm", async ({ page }, name: string) => {
  await openTravelers(page);
  await travelers(page)
    .filter({ hasText: name })
    .getByRole("button", { name: "Remove", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: `Remove ${name} from this trip?` });
  await dialog.getByRole("button", { name: "Remove", exact: true }).click();
});

When("I leave the trip and confirm", async ({ page }) => {
  await openTravelers(page);
  await page.getByRole("button", { name: "Leave trip", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Leave this trip?" });
  await dialog.getByRole("button", { name: "Leave", exact: true }).click();
});

Then("{string} is not on my home page", async ({ page }, name: string) => {
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText(name, { exact: true })).toHaveCount(0);
});
