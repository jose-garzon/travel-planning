import { expect, type Page } from "@playwright/test";
import { Given, Then, When } from "./fixtures";
import { currentTrip, gapBefore } from "./transfers.steps";

type Entry = {
  date?: string;
  departTime?: string;
  arriveDate?: string;
  arriveTime?: string;
  cost?: number;
  currency?: string;
  rate?: string;
};

const sheet = (page: Page) => page.getByRole("dialog");

/** Opens the trip and the add sheet of the gap before `city`. */
async function startAdding(page: Page, city: string) {
  await page.goto(`/trips/${currentTrip(page).id}`);
  const add = gapBefore(page, city).getByRole("button", {
    name: new RegExp(`^How do you get to ${city}\\?`),
  });
  // Desktop: only the "+ Add" text of an empty gap takes the pointer. The
  // click is retried until the sheet opens: a click before hydration is lost.
  await expect(async () => {
    const addText = add.getByText("Add", { exact: true });
    await ((await addText.isVisible()) ? addText : add).click({ timeout: 2000 });
    await expect(sheet(page)).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 20_000 });
}

/** Zones of the cities the scenarios use; seeded trips carry no city ids, so the form asks. */
const ZONES: Record<string, string> = { Bogotá: "America/Bogota", Madrid: "Europe/Madrid" };

async function fillZones(page: Page) {
  const dialog = sheet(page);
  const ends = [
    { zone: "Departure time zone", city: "From" },
    { zone: "Arrival time zone", city: "To" },
  ];
  for (const { zone, city } of ends) {
    const field = dialog.getByRole("textbox", { name: zone });
    const name = await dialog.getByRole("textbox", { name: city, exact: true }).inputValue();
    if ((await field.isVisible()) && ZONES[name] !== undefined) {
      await field.fill(ZONES[name]);
    }
  }
}

async function fillEntry(page: Page, mode: string, entry: Entry) {
  const dialog = sheet(page);
  await dialog.getByLabel("Type").selectOption({ label: mode });
  if (entry.date !== undefined) {
    await dialog.getByLabel("Departure date").fill(entry.date);
  }
  if (entry.departTime !== undefined) {
    await dialog.getByLabel("Departure time", { exact: true }).fill(entry.departTime);
  }
  if (entry.arriveDate !== undefined) {
    await dialog.getByLabel("Arrival date").fill(entry.arriveDate);
  }
  if (entry.arriveTime !== undefined) {
    await dialog.getByLabel("Arrival time", { exact: true }).fill(entry.arriveTime);
  }
  await fillZones(page);
  if (entry.cost !== undefined) {
    await dialog.getByLabel("Price per person").fill(String(entry.cost));
  }
  if (entry.currency !== undefined) {
    await dialog.getByLabel("Currency").fill(entry.currency);
  }
  if (entry.rate !== undefined) {
    await dialog.getByLabel(/^1 [A-Z]{3} = \?/).fill(entry.rate);
  }
}

/** Saves and waits for the answer; the sheet closes only when the save worked. */
async function save(page: Page) {
  const [response] = await Promise.all([
    page.waitForResponse(
      (candidate) =>
        candidate.url().includes("/transfers") &&
        ["POST", "PATCH"].includes(candidate.request().method()),
    ),
    sheet(page).getByRole("button", { name: "Save transfer" }).click(),
  ]);
  if (response.ok()) {
    await expect(sheet(page)).toBeHidden();
  }
}

async function addTransfer(page: Page, mode: string, city: string, entry: Entry) {
  await startAdding(page, city);
  await fillEntry(page, mode, entry);
  await save(page);
}

const cards = (page: Page) =>
  page.getByRole("region", { name: /^(Getting to|Return from) / }).getByRole("article");

When("I start adding a transfer before {string}", async ({ page }, city: string) => {
  await startAdding(page, city);
});

Then(
  "the transfer form shows from {string} and to {string}",
  async ({ page }, from: string, to: string) => {
    const dialog = sheet(page);
    await expect(dialog.getByRole("textbox", { name: "From" })).toHaveValue(from);
    await expect(dialog.getByRole("textbox", { name: "To" })).toHaveValue(to);
  },
);

When("I save a {string} transfer on {string}", async ({ page }, mode: string, date: string) => {
  await fillEntry(page, mode, { date });
  await save(page);
});

When(
  "I add a {string} transfer before {string} departing {string} at {string} and arriving {string} at {string}",
  async (
    { page },
    mode: string,
    city: string,
    date: string,
    departTime: string,
    arriveDate: string,
    arriveTime: string,
  ) => {
    await addTransfer(page, mode, city, { date, departTime, arriveDate, arriveTime });
  },
);

When(
  "I add a {string} transfer before {string} on {string} without times or cost",
  async ({ page }, mode: string, city: string, date: string) => {
    await addTransfer(page, mode, city, { date });
  },
);

When(
  "I add a {string} transfer before {string} on {string}",
  async ({ page }, mode: string, city: string, date: string) => {
    await addTransfer(page, mode, city, { date });
  },
);

When(
  "I add a {string} transfer before {string} on {string} costing {int} {string} at rate {string}",
  async (
    { page },
    mode: string,
    city: string,
    date: string,
    cost: number,
    currency: string,
    rate: string,
  ) => {
    await addTransfer(page, mode, city, { date, cost, currency, rate });
  },
);

Given("the trip currency is {string}", async ({ page }, currency: string) => {
  // Seeded trips are priced in COP; fail loudly if that ever changes.
  expect(currency).toBe("COP");
  const response = await page.request.get(`/api/v1/trips/${currentTrip(page).id}/transfers`);
  expect((await response.json()).currency).toBe(currency);
});

Then("the transfer shows a duration of {string}", async ({ page }, duration: string) => {
  // The card sets durations compactly ("9h 30m"); the scenario spells "9 hr 30 min".
  const parts = /^(?:(\d+) hr)?\s*(?:(\d+) min)?$/.exec(duration);
  const compact = [parts?.[1] ? `${parts[1]}h` : null, parts?.[2] ? `${parts[2]}m` : null]
    .filter((part) => part !== null)
    .join(" ");
  await expect(cards(page).getByText(compact, { exact: true })).toBeVisible();
});

Then("the transfer shows the arrival as next day", async ({ page }) => {
  await expect(cards(page).getByText("+1", { exact: true })).toBeVisible();
});

Then("the transfer shows no duration", async ({ page }) => {
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page).first()).not.toContainText(/\b\d+\s*(hr|min)\b/);
});

Then("the transfer shows {string}", async ({ page }, text: string) => {
  // The card updates after the page refresh, which is slow under load.
  await expect(cards(page).getByText(text)).toBeVisible({ timeout: 15_000 });
});

Then("I see the warning {string}", async ({ page }, text: string) => {
  // The warning shows after the page refresh that follows the save.
  await expect(page.getByText(text)).toBeVisible({ timeout: 15_000 });
});

Then("the transfer is not saved", async ({ page }) => {
  const response = await page.request.get(`/api/v1/trips/${currentTrip(page).id}/transfers`);
  expect((await response.json()).transfers).toHaveLength(0);
});

When(
  "I change the transfer's booking reference to {string}",
  async ({ page }, reference: string) => {
    await page.goto(`/trips/${currentTrip(page).id}`);
    await cards(page)
      .getByRole("button", { name: /^Edit transfer/ })
      .click();
    const dialog = sheet(page);
    const field = dialog.getByLabel("Booking reference");
    if (!(await field.isVisible())) {
      await dialog.getByText("More details").click();
    }
    await field.fill(reference);
    await save(page);
  },
);

When("I delete the transfer", async ({ page }) => {
  await cards(page)
    .getByRole("button", { name: /^Delete transfer/ })
    .click();
  const [response] = await Promise.all([
    page.waitForResponse(
      (candidate) =>
        candidate.url().includes("/transfers/") && candidate.request().method() === "DELETE",
    ),
    sheet(page).getByRole("button", { name: "Delete", exact: true }).click(),
  ]);
  expect(response.status()).toBe(204);
  await expect(sheet(page)).toBeHidden();
});
