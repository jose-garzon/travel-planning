import { expect, type Page } from "@playwright/test";
import { Given, Then, When } from "./fixtures";
import { renameDestination, setToday } from "./support/today";
import { currentTrip } from "./transfers.steps";

function transferTo(page: Page, city: string) {
  return page.getByRole("article", { name: new RegExp(` to ${city},`) });
}

Given("today is {string}", async ({ page }, date: string) => {
  await setToday(page, currentTrip(page).id, date);
});

When(
  "I change the trip's second destination to {string}",
  async ({ page }, destination: string) => {
    const trip = currentTrip(page);
    await renameDestination(trip.id, 1, destination);
    await page.goto(`/trips/${trip.id}`);
  },
);

// The next transfer lives on home's next-trip board, as a link to its card.
function nextTransferLink(page: Page, from: string, to: string) {
  return page.getByRole("link", { name: new RegExp(`^Next transfer: .*${from} to ${to}`) });
}

Then(
  "the next trip shows the transfer {string} to {string} leaving tomorrow",
  async ({ page }, from: string, to: string) => {
    const link = nextTransferLink(page, from, to);
    await expect(link).toBeVisible();
    await expect(link).toContainText("Tomorrow");
  },
);

Then("the next trip shows no transfer", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /^Next transfer:/ })).toHaveCount(0);
});

Then(
  "the next trip shows the transfer {string} to {string}",
  async ({ page }, from: string, to: string) => {
    await expect(nextTransferLink(page, from, to)).toBeVisible();
  },
);

Then("the transfer to {string} is shown as past", async ({ page }, city: string) => {
  await expect(transferTo(page, city).getByText("Past", { exact: true })).toBeVisible();
});

Then("the transfer to {string} shows {string}", async ({ page }, city: string, text: string) => {
  await expect(transferTo(page, city)).toContainText(text);
});
