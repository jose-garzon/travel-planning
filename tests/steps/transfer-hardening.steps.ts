import { expect } from "@playwright/test";
import { Given, Then, When } from "./fixtures";
import { shiftedDate } from "./support/today";
import { currentTrip } from "./transfers.steps";

const ZONES: Record<string, string> = { Bogotá: "America/Bogota" };

Given(
  "the trip has a flight from {string} to {string} on {string} at {string} arriving at {string}",
  async (
    { page },
    from: string,
    to: string,
    date: string,
    departTime: string,
    arriveTime: string,
  ) => {
    const trip = currentTrip(page);
    const departDate = shiftedDate(page, date);
    const response = await page.request.post(`/api/v1/trips/${trip.id}/transfers`, {
      data: {
        gap: trip.legs.findIndex((leg) => leg.from === from && leg.to === to),
        mode: "flight",
        from,
        to,
        charge: "all",
        departDate,
        departTime,
        departTz: ZONES[from] ?? "America/Bogota",
        arriveDate: departDate,
        arriveTime,
        arriveTz: ZONES[to] ?? "America/Bogota",
      },
    });
    expect(response.status()).toBe(201);
  },
);

Given("that trip has a flight before {string}", async ({ page }, city: string) => {
  const trip = currentTrip(page);
  const gap = trip.legs.findIndex((leg) => leg.to === city);
  const leg = trip.legs[gap];
  const response = await page.request.post(`/api/v1/trips/${trip.id}/transfers`, {
    data: {
      gap,
      mode: "flight",
      from: leg?.from,
      to: city,
      charge: "all",
      departDate: shiftedDate(page, "2027-04-01"),
    },
  });
  expect(response.status()).toBe(201);
});

When("I open that trip on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto(`/trips/${currentTrip(page).id}`);
});

Then("the transfer is announced as {string}", async ({ page }, sentence: string) => {
  await expect(page.getByRole("article", { name: sentence, exact: true })).toBeVisible();
});

Then("the full city name {string} is visible", async ({ page }, city: string) => {
  const names = page.getByText(city, { exact: true }).filter({ visible: true });
  await expect(names.first()).toBeVisible();
  // Wrapped, not clipped: nothing scrolls sideways on the page.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
