import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { Then, When } from "./fixtures";
import { openTravelers } from "./support/travelers";

/** The travelers list (desktop: the card is always open). */
function travelers(page: Page) {
  return page.getByRole("region", { name: "Travelers" }).getByRole("listitem");
}

/**
 * Scrolls the control to the middle of the screen first: on phones the
 * assistant launcher is pinned to the foot and would take a click aimed
 * at a control scrolled just into view.
 */
async function clickCentered(target: Locator) {
  await target.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await target.click();
}

When("I remove {string} and confirm", async ({ page }, name: string) => {
  await openTravelers(page);
  await clickCentered(
    travelers(page).filter({ hasText: name }).getByRole("button", { name: "Remove", exact: true }),
  );
  const dialog = page.getByRole("dialog", { name: `Remove ${name} from this trip?` });
  await dialog.getByRole("button", { name: "Remove", exact: true }).click();
});

When("I leave the trip and confirm", async ({ page }) => {
  await openTravelers(page);
  await clickCentered(page.getByRole("button", { name: "Leave trip", exact: true }));
  const dialog = page.getByRole("dialog", { name: "Leave this trip?" });
  await dialog.getByRole("button", { name: "Leave", exact: true }).click();
});

Then("{string} is not on my home page", async ({ page }, name: string) => {
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText(name, { exact: true })).toHaveCount(0);
});
