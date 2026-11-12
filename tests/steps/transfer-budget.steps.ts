import { randomUUID } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@libsql/client";
import { expect, type Page } from "@playwright/test";
import { Given, Then, When } from "./fixtures";
import { signedInEmail } from "./support/session";
import { seedMember } from "./support/trips";

const client = createClient({
  url: process.env.DATABASE_URL ?? "file:local.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const ready = client.execute("PRAGMA busy_timeout = 5000;");

/** The trip the signed-in traveler created last (transfers.steps.ts seeds it). */
async function latestTrip(page: Page): Promise<string> {
  await ready;
  const found = await client.execute({
    sql:
      "SELECT t.id FROM trip t JOIN trip_member m ON m.trip_id = t.id " +
      "JOIN user u ON u.id = m.user_id WHERE u.email = ? ORDER BY t.created_at DESC LIMIT 1",
    args: [signedInEmail(page)],
  });
  const id = found.rows[0]?.id;
  if (typeof id !== "string") {
    throw new Error("no trip seeded for this scenario");
  }
  return id;
}

function budget(page: Page) {
  return page.getByRole("region", { name: "Budget", exact: true });
}

/** "COP 100" in the app's English format, tolerant of the non-breaking space. */
function money(amount: number, currency: string): RegExp {
  return new RegExp(`${currency}\\s*${amount}(?![\\d,.])`);
}

Given("the trip has {int} travelers", async ({ page }, count: number) => {
  const tripId = await latestTrip(page);
  for (let index = 1; index < count; index += 1) {
    await seedMember({ tripId, name: `Friend ${index}`, role: "editor" });
  }
});

Given(
  "the trip has a flight from {string} to {string} costing {int} {string} for all travelers",
  async ({ page }, from: string, to: string, cost: number, currency: string) => {
    const tripId = await latestTrip(page);
    const response = await page.request.post(`/api/v1/trips/${tripId}/transfers`, {
      data: {
        gap: 0,
        mode: "flight",
        from,
        to,
        departDate: "2027-03-15",
        cost,
        currency,
        charge: "all",
      },
    });
    if (response.status() !== 201) {
      throw new Error(`seed flight: ${response.status()} ${(await response.text()).slice(0, 200)}`);
    }
  },
);

Given(
  "the trip had a flight budget item {string} of {int} {string} for me before the update",
  async ({ page }, label: string, amount: number, currency: string) => {
    const tripId = await latestTrip(page);
    const me = await client.execute({
      sql: "SELECT id FROM user WHERE email = ?",
      args: [signedInEmail(page)],
    });
    await client.execute({
      sql:
        "INSERT INTO budget_item (id, trip_id, category, label, amount, currency, rate, user_id, stop, created_at) " +
        "VALUES (?, ?, 'flights', ?, ?, ?, '1', ?, 0, ?)",
      args: [
        randomUUID(),
        tripId,
        label,
        amount * 100,
        currency,
        me.rows[0]?.id ?? null,
        Date.now(),
      ],
    });
  },
);

When("I open the budget", async ({ page }) => {
  await page.goto(`/trips/${await latestTrip(page)}#budget`);
});

When("one traveler leaves the trip", async ({ page }) => {
  const tripId = await latestTrip(page);
  await client.execute({
    sql:
      "DELETE FROM trip_member WHERE trip_id = ? AND user_id = (" +
      "SELECT user_id FROM trip_member WHERE trip_id = ? AND role = 'editor' LIMIT 1)",
    args: [tripId, tripId],
  });
  await page.goto(`/trips/${tripId}#budget`);
});

When("the flights migration runs", async ({ page }) => {
  const dir = join(process.cwd(), "src/shared/db/migrations");
  const file = readdirSync(dir).find((name) => name.endsWith("_flights_to_transfers.sql"));
  if (file === undefined) {
    throw new Error("flights migration not found");
  }
  const statements = readFileSync(join(dir, file), "utf8")
    .split("--> statement-breakpoint")
    .map((sql) => sql.trim())
    .filter((sql) => sql !== "");
  await client.batch(statements, "write");
  await page.goto(`/trips/${await latestTrip(page)}`);
});

Then(
  "each traveler's share includes {int} {string} for transfers",
  async ({ page }, amount: number, currency: string) => {
    const rows = budget(page).getByRole("region", { name: "Per person" }).getByRole("listitem");
    await expect(rows.first()).toBeVisible();
    for (const row of await rows.all()) {
      await expect(row).toContainText(money(amount, currency));
    }
  },
);

Then(
  "the trip total for transfers is {int} {string}",
  async ({ page }, amount: number, currency: string) => {
    await expect(
      budget(page)
        .getByRole("listitem")
        .filter({ hasText: /^Transfers/ }),
    ).toContainText(money(amount, currency));
  },
);

Then("the {string} group lists {string}", async ({ page }, group: string, label: string) => {
  await expect(
    budget(page)
      .getByRole("region", { name: group, exact: true })
      .getByRole("link", { name: label }),
  ).toBeVisible();
});

Then(
  "my budget includes {int} {string} for transfers",
  async ({ page }, amount: number, currency: string) => {
    await expect(
      budget(page).getByRole("region", { name: "Per person" }).getByRole("listitem").first(),
    ).toContainText(money(amount, currency));
  },
);

Then("the budget has no {string} category", async ({ page }, category: string) => {
  await expect(budget(page).getByText(category, { exact: true })).toHaveCount(0);
});
