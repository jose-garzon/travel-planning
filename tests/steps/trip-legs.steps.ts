import { expect } from "@playwright/test";
import { Then, When } from "./fixtures";

const DAY_MS = 24 * 60 * 60 * 1000;

/** `+5` / `-1` / `0`: whole days from today (UTC), as `YYYY-MM-DD`. */
function dayFromOffset(offset: string): string {
  return new Date(Date.now() + Number(offset) * DAY_MS).toISOString().slice(0, 10);
}

function leg(page: import("@playwright/test").Page, legNumber: number) {
  return page.getByRole("group", { name: `Stop ${legNumber}` });
}

When(
  "I set leg {int} from {string} to {string} on day {word}",
  async ({ page }, legNumber: number, from: string, to: string, offset: string) => {
    await leg(page, legNumber).getByLabel("From", { exact: true }).fill(from);
    await leg(page, legNumber).getByLabel("To", { exact: true }).fill(to);
    await leg(page, legNumber).getByLabel("Departure date").fill(dayFromOffset(offset));
  },
);

When("I set leg {int} to {string}", async ({ page }, legNumber: number, to: string) => {
  await leg(page, legNumber).getByLabel("To", { exact: true }).fill(to);
});

When(
  "I set leg {int} to {string} on day {word}",
  async ({ page }, legNumber: number, to: string, offset: string) => {
    await leg(page, legNumber).getByLabel("To", { exact: true }).fill(to);
    await leg(page, legNumber).getByLabel("Departure date").fill(dayFromOffset(offset));
  },
);

When("I add a leg", async ({ page }) => {
  // Clicking blurs the open "To" field, which collapses into a heading and
  // shifts the button mid-click. Wait for the layout to settle, then check
  // a leg was really added.
  const legs = page.getByRole("group", { name: /^Stop \d+$/ });
  const before = await legs.count();
  await expect(async () => {
    if ((await legs.count()) === before) {
      await page.getByRole("button", { name: "Add stop" }).click();
    }
    await expect(legs).toHaveCount(before + 1, { timeout: 1000 });
  }).toPass({ timeout: 10_000 });
});

When("I add the return home leg", async ({ page }) => {
  // Same mid-click layout shift as "I add a leg": retry until the leg lands.
  const legs = page.getByRole("group", { name: /^Stop \d+$/ });
  const before = await legs.count();
  await expect(async () => {
    if ((await legs.count()) === before) {
      await page.getByRole("button", { name: "Add return home" }).click();
    }
    await expect(legs).toHaveCount(before + 1, { timeout: 1000 });
  }).toPass();
});

When("I remove leg {int}", async ({ page }, legNumber: number) => {
  await page.getByRole("button", { name: `Remove stop ${legNumber}` }).click();
});

When("I add legs until there are {int}", async ({ page }, count: number) => {
  const add = page.getByRole("button", { name: "Add stop" });
  for (let n = 1; n < count; n++) {
    await add.click();
  }
  await expect(page.getByRole("group", { name: /^Stop \d+$/ })).toHaveCount(count);
});

Then("leg {int} starts from {string}", async ({ page }, legNumber: number, from: string) => {
  await expect(leg(page, legNumber).getByLabel("From", { exact: true })).toHaveValue(from);
});

Then(
  "leg {int} goes from {string} to {string}",
  async ({ page }, legNumber: number, from: string, to: string) => {
    await expect(leg(page, legNumber).getByLabel("From", { exact: true })).toHaveValue(from);
    await expect(leg(page, legNumber).getByLabel("To", { exact: true })).toHaveValue(to);
  },
);

Then("I cannot add the return home leg", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Add return home" })).toHaveCount(0);
});

Then("I cannot add a leg", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Add stop" })).toBeDisabled();
});

Then("I cannot remove leg {int}", async ({ page }, legNumber: number) => {
  await expect(page.getByRole("button", { name: `Remove stop ${legNumber}` })).toHaveCount(0);
});

Then("the trip is not saved", async ({ page }) => {
  await expect(page).toHaveURL(/\/trips\/new/);
});
