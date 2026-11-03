import { expect } from "@playwright/test";
import { Then, When } from "./fixtures";

const DAY_MS = 24 * 60 * 60 * 1000;

/** `+5` / `-1` / `0`: whole days from today (UTC), as `YYYY-MM-DD`. */
function dayFromOffset(offset: string): string {
  return new Date(Date.now() + Number(offset) * DAY_MS).toISOString().slice(0, 10);
}

function leg(page: import("@playwright/test").Page, legNumber: number) {
  return page.getByRole("group", { name: `Leg ${legNumber}` });
}

When(
  "I set leg {int} from {string} to {string} on day {word}",
  async ({ page }, legNumber: number, from: string, to: string, offset: string) => {
    await leg(page, legNumber).getByLabel("From").fill(from);
    await leg(page, legNumber).getByLabel("To").fill(to);
    await leg(page, legNumber).getByLabel("Departure date").fill(dayFromOffset(offset));
  },
);

When("I set leg {int} to {string}", async ({ page }, legNumber: number, to: string) => {
  await leg(page, legNumber).getByLabel("To").fill(to);
});

When(
  "I set leg {int} to {string} on day {word}",
  async ({ page }, legNumber: number, to: string, offset: string) => {
    await leg(page, legNumber).getByLabel("To").fill(to);
    await leg(page, legNumber).getByLabel("Departure date").fill(dayFromOffset(offset));
  },
);

When("I add a leg", async ({ page }) => {
  await page.getByRole("button", { name: "Add stop" }).click();
});

When("I add the return home leg", async ({ page }) => {
  await page.getByRole("button", { name: "Add return home" }).click();
});

When("I remove leg {int}", async ({ page }, legNumber: number) => {
  await page.getByRole("button", { name: `Remove leg ${legNumber}` }).click();
});

When("I add legs until there are {int}", async ({ page }, count: number) => {
  const add = page.getByRole("button", { name: "Add stop" });
  for (let n = 1; n < count; n++) {
    await add.click();
  }
  await expect(page.getByRole("group", { name: /^Leg \d+$/ })).toHaveCount(count);
});

Then("leg {int} starts from {string}", async ({ page }, legNumber: number, from: string) => {
  await expect(leg(page, legNumber).getByLabel("From")).toHaveValue(from);
});

Then(
  "leg {int} goes from {string} to {string}",
  async ({ page }, legNumber: number, from: string, to: string) => {
    await expect(leg(page, legNumber).getByLabel("From")).toHaveValue(from);
    await expect(leg(page, legNumber).getByLabel("To")).toHaveValue(to);
  },
);

Then("I cannot add the return home leg", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Add return home" })).toHaveCount(0);
});

Then("I cannot add a leg", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Add stop" })).toBeDisabled();
});

Then("I cannot remove leg {int}", async ({ page }, legNumber: number) => {
  await expect(page.getByRole("button", { name: `Remove leg ${legNumber}` })).toHaveCount(0);
});

Then("the trip is not saved", async ({ page }) => {
  await expect(page).toHaveURL(/\/trips\/new/);
});
