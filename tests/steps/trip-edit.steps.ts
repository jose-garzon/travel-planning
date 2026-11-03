import { createClient } from "@libsql/client";
import { expect } from "@playwright/test";
import type { DataTable } from "playwright-bdd";
import { Given, Then, When } from "./fixtures";
import { seedTrip } from "./support/trips";

const client = createClient({
  url: process.env.DATABASE_URL ?? "file:local.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const busyTimeoutReady = client.execute("PRAGMA busy_timeout = 5000;");

const DAY_MS = 24 * 60 * 60 * 1000;

/** Trip ids by name, per worker; scenarios in a worker run one after another. */
const tripIds = new Map<string, string>();

/** The signed-in user's email, found through the session cookie `signInAs` set. */
async function signedInEmail(page: import("@playwright/test").Page): Promise<string> {
  await busyTimeoutReady;
  const cookies = await page.context().cookies();
  const token = cookies.find((cookie) => cookie.name === "better-auth.session_token")?.value;
  const row = await client.execute({
    sql: "SELECT u.email FROM user u JOIN session s ON s.user_id = u.id WHERE s.token = ?",
    args: [token ?? ""],
  });
  const email = row.rows[0]?.email;
  if (typeof email !== "string") {
    throw new Error("no signed-in user for this page");
  }

  return email;
}

function dayOffset(offset: string): number {
  return Number(offset);
}

Given("I have a trip {string} with route:", async ({ page }, name: string, table: DataTable) => {
  const legs = table.hashes().map((row) => ({
    from: row.from ?? "",
    to: row.to ?? "",
    date: new Date(Date.now() + dayOffset(row.day ?? "0") * DAY_MS).toISOString().slice(0, 10),
  }));
  const id = await seedTrip({
    ownerEmail: await signedInEmail(page),
    name,
    currency: "COP",
    legs,
  });
  tripIds.set(name, id);
});

When("I open the trip {string}", async ({ page }, name: string) => {
  await page.goto(`/trips/${tripIds.get(name)}`);
  await expect(page.getByLabel("Trip name")).toHaveValue(name);
});

// biome-ignore lint/correctness/noEmptyPattern: playwright-bdd requires this exact destructuring signature.
When("someone else changes the trip {string}", async ({}, name: string) => {
  await busyTimeoutReady;
  await client.execute({
    sql: "UPDATE trip SET version = version + 1, updated_at = ? WHERE id = ?",
    args: [Date.now(), tripIds.get(name) ?? ""],
  });
});

When("I save the changes", async ({ page }) => {
  await page.getByRole("button", { name: "Save changes" }).click();
});

When("I delete the trip and confirm", async ({ page }) => {
  await page.getByRole("button", { name: "Delete trip" }).click();
  await page
    .getByRole("dialog", { name: "Delete this trip?" })
    .getByRole("button", { name: "Delete", exact: true })
    .click();
});

When("I go back to the home page", async ({ page }) => {
  await page.getByRole("link", { name: "Cancel" }).click();
});

Then("I see the dialog {string}", async ({ page }, name: string) => {
  await expect(page.getByRole("dialog", { name })).toBeVisible();
});

Then("I do not see {string} on the home page", async ({ page }, name: string) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText(name, { exact: true })).toHaveCount(0);
});
