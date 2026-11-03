import { expect } from "@playwright/test";
import { Then, When } from "./fixtures";

function legField(page: import("@playwright/test").Page, legNumber: number, field: string) {
  return page
    .getByRole("group", { name: new RegExp(`^(Leg|Tramo) ${legNumber}$`) })
    .getByRole("combobox", { name: field, exact: true });
}

When(
  "I search {string} in leg {int} {string}",
  async ({ page }, query: string, legNumber: number, field: string) => {
    await legField(page, legNumber, field).fill(query);
  },
);

When("I focus leg {int} {string}", async ({ page }, legNumber: number, field: string) => {
  await legField(page, legNumber, field).focus();
});

When(
  "I set leg {int} from {string} to nothing",
  async ({ page }, legNumber: number, from: string) => {
    const field = legField(page, legNumber, "From");
    await field.fill(from);
    await page
      .getByRole("option", { name: new RegExp(`^[A-Z]{3} ${from}`) })
      .first()
      .click();
  },
);

Then("I see the city option {string}", async ({ page }, option: string) => {
  await expect(page.getByRole("option", { name: option }).first()).toBeVisible();
});

Then("I do not see the city option {string}", async ({ page }, option: string) => {
  // Wait for a list to be there, so the absence is not just "not loaded yet".
  await expect(page.getByRole("option").first()).toBeVisible();
  await expect(page.getByRole("option", { name: option })).toHaveCount(0);
});

Then("I see a list of city options", async ({ page }) => {
  await expect(page.getByRole("listbox")).toBeVisible();
  expect(await page.getByRole("option").count()).toBeGreaterThan(0);
});
