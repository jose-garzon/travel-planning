import { expect } from "@playwright/test";
import type { DataTable } from "playwright-bdd";
import { Given, Then } from "./fixtures";
import { signedInEmail } from "./support/session";
import { seedTrip } from "./support/trips";

Given("I have a trip {string} with route:", async ({ page }, name: string, table: DataTable) => {
  await seedTrip({
    ownerEmail: signedInEmail(page),
    name,
    currency: "USD",
    legs: table.hashes().map((row) => ({
      from: row.from as string,
      to: row.to as string,
      dayOffset: Number(row.day),
    })),
  });
});

const line = (page: import("@playwright/test").Page) => page.getByRole("region", { name: "Route" });

Then("the trip stops are {string}", async ({ page }, stops: string) => {
  await expect(line(page).getByTestId("stop-name")).toHaveText(stops.split(", "));
});

Then(
  "the stop {string} shows {string} and {string}",
  async ({ page }, code: string, first: string, second: string) => {
    const station = line(page)
      .getByRole("listitem")
      .filter({ has: page.getByTestId("stop-name").getByText(code, { exact: true }) });
    await expect(station).toContainText(first);
    await expect(station).toContainText(second);
  },
);

Then("the current stop is {string}", async ({ page }, code: string) => {
  await expect(line(page).locator('[aria-current="step"]')).toHaveText(code);
});

Then(
  "I see {string} in my trip list with {string}",
  async ({ page }, name: string, route: string) => {
    const otherTrips = page.getByRole("region", { name: "Other trips" });
    const trip = otherTrips.getByRole("link").filter({ hasText: name });
    await expect(trip).toContainText(route);
  },
);
