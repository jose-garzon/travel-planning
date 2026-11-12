import { randomUUID } from "node:crypto";
import { expect, type Page } from "@playwright/test";
import { Given, Then, When } from "./fixtures";
import { signedInEmail, signInAs } from "./support/session";
import { seedTransfer } from "./support/transfers";
import { seedTrip } from "./support/trips";

type SeededTrip = { id: string; legs: { from: string; to: string }[] };

/** The trip each page's traveler seeded last: "the trip", "that trip". */
const tripOfPage = new WeakMap<Page, SeededTrip>();

function currentTrip(page: Page): SeededTrip {
  const trip = tripOfPage.get(page);
  if (trip === undefined) {
    throw new Error("no trip seeded for this scenario");
  }
  return trip;
}

async function ownTrip(page: Page, stops: { from: string; to: string; date: string }[]) {
  const id = await seedTrip({
    ownerEmail: signedInEmail(page),
    name: `Trip ${randomUUID().slice(0, 8)}`,
    currency: "COP",
    legs: stops,
  });
  tripOfPage.set(page, { id, legs: stops });
}

/** Gap index of the leg from `from` to `to`; past the last leg is the return gap. */
function gapOf(trip: SeededTrip, from: string, to: string): number {
  const index = trip.legs.findIndex((leg) => leg.from === from && leg.to === to);
  return index === -1 ? trip.legs.length : index;
}

function gapBefore(page: Page, city: string) {
  return page.getByRole("region", { name: `Getting to ${city}` });
}

Given("I am signed in as a traveler", async ({ page }) => {
  await signInAs(page, {
    email: `traveler-${randomUUID().slice(0, 8)}@example.com`,
    displayName: "Traveler",
  });
});

Given(
  "I own a trip from {string} to {string} on {string} and to {string} on {string}",
  async (
    { page },
    origin: string,
    first: string,
    firstDate: string,
    second: string,
    secondDate: string,
  ) => {
    await ownTrip(page, [
      { from: origin, to: first, date: firstDate },
      { from: first, to: second, date: secondDate },
    ]);
  },
);

Given(
  "I own a trip from {string} to {string} on {string}",
  async ({ page }, origin: string, destination: string, date: string) => {
    await ownTrip(page, [{ from: origin, to: destination, date }]);
  },
);

Given(
  "the trip has a {word} from {string} to {string} on {string}",
  async ({ page }, mode: string, from: string, to: string, date: string) => {
    const trip = currentTrip(page);
    await seedTransfer(page, trip.id, {
      gap: gapOf(trip, from, to),
      mode,
      from,
      to,
      departDate: date,
    });
  },
);

Given(
  "the trip has a {word} from {string} to {string} on {string} at {string}",
  async ({ page }, mode: string, from: string, to: string, date: string, time: string) => {
    const trip = currentTrip(page);
    await seedTransfer(page, trip.id, {
      gap: gapOf(trip, from, to),
      mode,
      from,
      to,
      departDate: date,
      departTime: time,
    });
  },
);

When("I open the trip", async ({ page }) => {
  await page.goto(`/trips/${currentTrip(page).id}`);
});

When("I open that trip", async ({ page }) => {
  await page.goto(`/trips/${currentTrip(page).id}`);
});

Then(
  "the gap before {string} shows {int} transfer(s)",
  async ({ page }, city: string, count: number) => {
    await expect(gapBefore(page, city).getByRole("article")).toHaveCount(count);
  },
);

Then("the gap before {string} asks {string}", async ({ page }, city: string, question: string) => {
  await expect(gapBefore(page, city).getByText(question)).toBeVisible();
});

Then(
  "the transfers before {string} are in this order: {string}, {string}",
  async ({ page }, city: string, first: string, second: string) => {
    const cards = gapBefore(page, city).getByRole("article");
    await expect(cards).toHaveCount(2);
    // Locale-free: each card marks its departure with <time datetime="…T08:00">.
    const departures = await cards.evaluateAll((nodes) =>
      nodes.map((node) => node.querySelector("time[datetime*='T']")?.getAttribute("datetime")),
    );
    expect(departures.map((value) => value?.split("T")[1])).toEqual([first, second]);
  },
);

Then("I see a gap before {string}", async ({ page }, city: string) => {
  await expect(gapBefore(page, city)).toBeVisible();
});

Then("I see a return gap after {string}", async ({ page }, city: string) => {
  await expect(page.getByRole("region", { name: `Return from ${city}` })).toBeVisible();
});
