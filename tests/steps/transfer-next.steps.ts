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

Then(
  "the next up card shows {string} to {string} leaving in {int} days",
  async ({ page }, from: string, to: string, days: number) => {
    const card = page.getByRole("region", { name: "Next up" });
    await expect(card.getByRole("link", { name: `${from} to ${to}` })).toBeVisible();
    await expect(card).toContainText(`in ${days} days`);
  },
);

Then("the next up card shows {string} to {string}", async ({ page }, from: string, to: string) => {
  const card = page.getByRole("region", { name: "Next up" });
  await expect(card.getByRole("link", { name: `${from} to ${to}` })).toBeVisible();
});

Then("the transfer to {string} is shown as past", async ({ page }, city: string) => {
  await expect(transferTo(page, city).getByText("Past", { exact: true })).toBeVisible();
});

Then("the transfer to {string} shows {string}", async ({ page }, city: string, text: string) => {
  await expect(transferTo(page, city)).toContainText(text);
});
