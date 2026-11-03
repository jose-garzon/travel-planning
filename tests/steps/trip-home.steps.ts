import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { Then } from "./fixtures";

const tripStops = (page: Page) =>
  page.getByRole("region", { name: "Trip stops" }).getByRole("listitem");

/** The station name of each stop ("Takeoff BOG", "MAD"), whitespace normalized. */
async function stopNames(page: Page): Promise<string[]> {
  const names = await tripStops(page).evaluateAll((items) =>
    items.map((item) => item.firstElementChild?.textContent ?? ""),
  );
  return names.map((text) => text.replace(/\s+/g, " ").trim());
}

Then("the trip stops are {string}", async ({ page }, expected: string) => {
  await expect(tripStops(page).first()).toBeVisible();
  expect((await stopNames(page)).join(", ")).toBe(expected);
});

async function stopItem(page: Page, code: string) {
  const index = (await stopNames(page)).indexOf(code);
  expect(index, `stop ${code} on the line`).toBeGreaterThanOrEqual(0);
  return tripStops(page).nth(index);
}

Then(
  "the stop {string} shows {string} and {string}",
  async ({ page }, code: string, first: string, second: string) => {
    await expect(tripStops(page).first()).toBeVisible();
    const item = await stopItem(page, code);
    await expect(item).toContainText(first);
    await expect(item).toContainText(second);
  },
);

Then("the current stop is {string}", async ({ page }, code: string) => {
  const current = page.getByRole("region", { name: "Trip stops" }).getByRole("listitem").filter({
    hasText: "Current stop",
  });
  await expect(current).toHaveCount(1);
  const names = await current.evaluateAll((items) =>
    items.map((item) => item.firstElementChild?.textContent ?? ""),
  );
  expect(names.map((text) => text.replace(/\s+/g, " ").trim())).toEqual([code]);
});

Then(
  "I see {string} in my trip list with {string}",
  async ({ page }, name: string, text: string) => {
    const otherTrips = page.getByRole("region", { name: "Other trips" });
    const panel = otherTrips.getByRole("link").filter({ hasText: name });
    await expect(panel).toBeVisible();
    await expect(panel.getByText(text, { exact: true })).toBeVisible();
  },
);
