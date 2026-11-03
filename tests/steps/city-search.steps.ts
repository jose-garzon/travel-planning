import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { Then, When } from "./fixtures";

/** The leg's group is named "Leg N" or "Tramo N" depending on the locale. */
function legField(page: Page, legNumber: number, field: string) {
  return page
    .getByRole("group", { name: new RegExp(`\\b${legNumber}$`) })
    .getByRole("combobox", { name: field });
}

function isCitiesResponse(url: string) {
  return new URL(url).pathname === "/api/v1/cities";
}

When(
  "I search {string} in leg {int} {string}",
  async ({ page }, query: string, legNumber: number, field: string) => {
    const input = legField(page, legNumber, field);
    await input.focus();
    // Wait for the answer to this query, so absence checks are not early.
    const answered = page.waitForResponse(
      (response) =>
        isCitiesResponse(response.url()) && new URL(response.url()).searchParams.get("q") === query,
    );
    await input.fill(query);
    await answered;
  },
);

When("I focus leg {int} {string}", async ({ page }, legNumber: number, field: string) => {
  await legField(page, legNumber, field).focus();
});

When(
  "I set leg {int} from {string} to nothing",
  async ({ page }, legNumber: number, from: string) => {
    const input = legField(page, legNumber, "From");
    await input.fill(from);
    await page
      .getByRole("option", { name: new RegExp(`\\b${from}\\b`) })
      .first()
      .click();
    await expect(input).toHaveValue(from);
  },
);

Then("I see the city option {string}", async ({ page }, option: string) => {
  await expect(page.getByRole("option", { name: option }).first()).toBeVisible();
});

Then("I do not see the city option {string}", async ({ page }, option: string) => {
  await expect(page.getByRole("option", { name: option })).toHaveCount(0);
});

Then("I see a list of city options", async ({ page }) => {
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(page.getByRole("option").first()).toBeVisible();
});
