import { expect, type Page } from "@playwright/test";
import { Given, When } from "./fixtures";
import { shiftedDate } from "./support/today";
import { currentTrip } from "./transfers.steps";

function toggle(page: Page) {
  return page.getByRole("button", { name: /^Join transfer/ });
}

Given(
  "the trip has an opt-in {word} from {string} to {string} costing {int} {string}",
  async ({ page }, mode: string, from: string, to: string, cost: number, currency: string) => {
    const trip = currentTrip(page);
    const index = trip.legs.findIndex((leg) => leg.from === from && leg.to === to);
    const response = await page.request.post(`/api/v1/trips/${trip.id}/transfers`, {
      data: {
        gap: index === -1 ? trip.legs.length : index,
        mode,
        from,
        to,
        departDate: shiftedDate(page, "2027-03-19"),
        cost,
        currency,
        charge: "opt-in",
      },
    });
    if (response.status() !== 201) {
      throw new Error(`seed opt-in: ${response.status()} ${(await response.text()).slice(0, 200)}`);
    }
  },
);

/** The scenarios start from the seeded trip without opening it. */
async function onTrip(page: Page) {
  if (!page.url().includes(currentTrip(page).id)) {
    await page.goto(`/trips/${currentTrip(page).id}`);
  }
}

When("I join the transfer", async ({ page }) => {
  await onTrip(page);
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
  await toggle(page).click();
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
});

When("I leave the transfer", async ({ page }) => {
  await toggle(page).click();
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
});
