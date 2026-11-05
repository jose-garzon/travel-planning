import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@libsql/client";
import { expect, type Page } from "@playwright/test";
import { Given, Then, When } from "./fixtures";
import { registerOwner } from "./support/owners";
import { signedInEmail, signInAs } from "./support/session";
import { seedInvite, seedMember, seedTrip } from "./support/trips";

const DAY_MS = 24 * 60 * 60 * 1000;

const client = createClient({
  url: process.env.DATABASE_URL ?? "file:local.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const busyTimeoutReady = client.execute("PRAGMA busy_timeout = 5000;");

type TripRef = { tripId: string; token: string };

/** The trips each scenario created, by name, so parallel scenarios never mix them up. */
const tripsByPage = new WeakMap<Page, Map<string, TripRef>>();

function refOf(page: Page, name: string): TripRef {
  const ref = tripsByPage.get(page)?.get(name);
  if (ref === undefined) {
    throw new Error(`no invite link was set up for "${name}" on this page`);
  }
  return ref;
}

function remember(page: Page, name: string, ref: TripRef): void {
  const trips = tripsByPage.get(page) ?? new Map<string, TripRef>();
  trips.set(name, ref);
  tripsByPage.set(page, trips);
}

/** A 43-character base64url token, like the app's (feature 009 plan "Data model"). */
function newToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Creates the owner, the trip and its live invite link, and remembers them for this page. */
async function ownTripWithLink(
  page: Page,
  owner: string,
  name: string,
  legs: Parameters<typeof seedTrip>[0]["legs"],
): Promise<void> {
  const ownerEmail = `${owner.toLowerCase()}-${randomUUID().slice(0, 8)}@example.com`;
  await signInAs(page, { email: ownerEmail, displayName: owner });
  registerOwner(page, name, ownerEmail);
  const tripId = await seedTrip({ ownerEmail, name, currency: "USD", legs });
  const token = newToken();
  await seedInvite({ tripId, token, expiresAt: new Date(Date.now() + 7 * DAY_MS) });
  remember(page, name, { tripId, token });
}

Given("{string} owns the trip {string} with an invite link", async ({ page }, owner, name) => {
  await ownTripWithLink(page, owner, name, []);
});

Given(
  "{string} owns the trip {string} from {string} to {string} with an invite link",
  async ({ page }, owner: string, name: string, start: string, end: string) => {
    await ownTripWithLink(page, owner, name, [
      { from: "Madrid", to: "Barcelona", date: start },
      { from: "Barcelona", to: "Madrid", date: end },
    ]);
  },
);

Given("{string} has {int} members", async ({ page }, name: string, total: number) => {
  await busyTimeoutReady;
  const { tripId } = refOf(page, name);
  const current = await client.execute({
    sql: "SELECT count(*) AS n FROM trip_member WHERE trip_id = ?",
    args: [tripId],
  });
  const existing = Number(current.rows[0]?.n ?? 0);

  for (let index = existing; index < total; index += 1) {
    await seedMember({ tripId, name: `Traveler ${index + 1}`, role: "editor" });
  }
});

/** Makes the link of `name` expired, reset, unknown, or gone with its trip. */
async function setLinkState(page: Page, name: string, state: string): Promise<void> {
  await busyTimeoutReady;
  const ref = refOf(page, name);

  if (state === "8 days old") {
    const now = Date.now();
    await client.execute({
      sql: "UPDATE trip_invite SET created_at = ?, expires_at = ? WHERE trip_id = ?",
      args: [now - 8 * DAY_MS, now - DAY_MS, ref.tripId],
    });
  } else if (state === "reset") {
    // Reset replaces the row's token, so the old link stops matching (plan "Data model").
    await client.execute({
      sql: "UPDATE trip_invite SET token = ? WHERE trip_id = ?",
      args: [newToken(), ref.tripId],
    });
  } else if (state === "unknown") {
    await client.execute({
      sql: "DELETE FROM trip_invite WHERE trip_id = ?",
      args: [ref.tripId],
    });
  } else if (state === "for a deleted trip") {
    await client.batch(
      [
        { sql: "DELETE FROM trip_invite WHERE trip_id = ?", args: [ref.tripId] },
        { sql: "DELETE FROM trip_leg WHERE trip_id = ?", args: [ref.tripId] },
        { sql: "DELETE FROM trip_member WHERE trip_id = ?", args: [ref.tripId] },
        { sql: "DELETE FROM trip WHERE id = ?", args: [ref.tripId] },
      ],
      "write",
    );
  } else {
    throw new Error(`unknown link state: ${state}`);
  }
}

// Matched by regex: the Scenario Outline leaves <state> unquoted.
Given(
  /^the invite link of "([^"]+)" is (8 days old|reset|for a deleted trip|unknown)$/,
  async ({ page }, name: string, state: string) => {
    await setLinkState(page, name, state);
  },
);

When("I open the invite link of {string}", async ({ page }, name: string) => {
  await page.goto(`/join/${refOf(page, name).token}`);
});

Given("I opened the invite link of {string}", async ({ page }, name: string) => {
  await page.goto(`/join/${refOf(page, name).token}`);
});

When("I join the trip", async ({ page }) => {
  await page.getByRole("button", { name: "Join trip" }).click();
});

Then("I see {string} and {string}", async ({ page }, first: string, second: string) => {
  await expect(page.getByText(first)).toBeVisible();
  await expect(page.getByText(second, { exact: true })).toBeVisible();
});

Then("I am on the trip page of {string} with {string}", async ({ page }, name, text) => {
  const { tripId } = refOf(page, name);
  await expect(page).toHaveURL(new RegExp(`/trips/${tripId}(\\?|$)`));
  await expect(page.getByText(text)).toBeVisible();
});

Then("{string} is on my home page", async ({ page }, name: string) => {
  await page.goto("/");
  await expect(page.getByText(name, { exact: true })).toBeVisible();
});

Then("I am not a member of {string}", async ({ page }, name: string) => {
  await busyTimeoutReady;
  const { tripId } = refOf(page, name);
  const found = await client.execute({
    sql: "SELECT 1 FROM trip_member m JOIN user u ON u.id = m.user_id WHERE m.trip_id = ? AND u.email = ?",
    args: [tripId, signedInEmail(page)],
  });
  expect(found.rows).toHaveLength(0);
});

/** Makes the signed-in user an editor of `name` (the member Outline, EC-1). */
Given("{string} is a member of {string}", async ({ page }, _who: string, name: string) => {
  await busyTimeoutReady;
  const { tripId } = refOf(page, name);
  await client.execute({
    sql: "INSERT INTO trip_member (trip_id, user_id, role, joined_at) SELECT ?, id, 'editor', ? FROM user WHERE email = ?",
    args: [tripId, Date.now(), signedInEmail(page)],
  });
});
