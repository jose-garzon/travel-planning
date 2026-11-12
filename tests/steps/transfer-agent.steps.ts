import { expect, type Page } from "@playwright/test";
import { Given, Then, When } from "./fixtures";

type Gap = { index: number; from: { name: string } | null; to: { name: string } | null };

/**
 * Replaces the model behind `POST /api/v1/trips/{id}/agent` for this page: the
 * reply is canned, the gap index comes from the public transfers API so the
 * suggestion names the gap the scenario means.
 */
async function fakeAgent(
  page: Page,
  option: { mode: string; from: string; to: string; source: string } | null,
) {
  await page.route("**/api/v1/trips/*/agent", async (route) => {
    const tripId = new URL(route.request().url()).pathname.split("/")[4];
    let suggestions: unknown[] = [];
    if (option !== null) {
      const listing = await page.request.get(`/api/v1/trips/${tripId}/transfers`);
      const { gaps } = (await listing.json()) as { gaps: Gap[] };
      const gap = gaps.find((g) => g.from?.name === option.from && g.to?.name === option.to);
      suggestions = [
        {
          id: "fake-transfer-1",
          kind: "transfer",
          gap: gap?.index ?? 0,
          mode: option.mode,
          departDate: "2027-03-15",
          departTime: "09:00",
          arriveDate: null,
          arriveTime: null,
          cost: 250000,
          currency: "COP",
          sourceUrl: option.source,
        },
      ];
    }
    await route.fulfill({
      json: {
        reply: option === null ? "I found nothing." : "Here is an option.",
        suggestions,
      },
    });
  });
}

Given(
  "the assistant will suggest a {word} from {string} to {string} with source {string}",
  async ({ page }, mode: string, from: string, to: string, source: string) => {
    await fakeAgent(page, { mode, from, to, source });
  },
);

Given("the assistant will suggest nothing", async ({ page }) => {
  await fakeAgent(page, null);
});

When("I find options for the gap before {string}", async ({ page }, city: string) => {
  await page
    .getByRole("region", { name: `Getting to ${city}` })
    .getByRole("button", { name: `Find options: Getting to ${city}` })
    .click();
});

Then("the assistant shows a transfer option with a source link", async ({ page }) => {
  const list = page.getByRole("list", { name: "Suggestions" });
  await expect(list.getByRole("link", { name: "Source" })).toBeVisible();
});

When("I approve the transfer option", async ({ page }) => {
  await page
    .getByRole("list", { name: "Suggestions" })
    .getByRole("button", { name: "Add to trip" })
    .click();
});

Then("the transfer links to {string}", async ({ page }, href: string) => {
  await expect(
    page.getByRole("region", { name: /^Getting to/ }).locator(`a[href="${href}"]`),
  ).toBeVisible();
});

When("I choose to add it myself", async ({ page }) => {
  await page
    .getByRole("region", { name: "Trip assistant" })
    .getByRole("button", { name: "Add" })
    .click();
});
