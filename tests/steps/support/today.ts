import { createClient } from "@libsql/client";
import type { Page } from "@playwright/test";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The server reads the real clock, so "today is X" moves the trip's dates
 * instead: every date of the scenario is shifted by the days between X and
 * the real today. Relative order and distance to today stay as written.
 */
const offsetOfPage = new WeakMap<Page, number>();

function realToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function shift(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Days to add to a scenario date, once "today is X" was said (else 0). */
export function todayOffset(page: Page): number {
  return offsetOfPage.get(page) ?? 0;
}

/** A scenario date as it is seeded: shifted by the page's "today". */
export function shiftedDate(page: Page, date: string): string {
  return shift(date, todayOffset(page));
}

const client = createClient({
  url: process.env.DATABASE_URL ?? "file:local.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

/** Declares today as `date`: shifts the dates of the trip's legs already seeded. */
export async function setToday(page: Page, tripId: string, date: string): Promise<void> {
  const days = Math.round(
    (Date.parse(`${realToday()}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / DAY_MS,
  );
  const delta = days - todayOffset(page);
  offsetOfPage.set(page, days);
  const legs = await client.execute({
    sql: "SELECT id, date FROM trip_leg WHERE trip_id = ?",
    args: [tripId],
  });
  await client.batch(
    legs.rows.flatMap((leg) =>
      typeof leg.date === "string"
        ? [
            {
              sql: "UPDATE trip_leg SET date = ? WHERE id = ?",
              args: [shift(leg.date, delta), String(leg.id)],
            },
          ]
        : [],
    ),
    "write",
  );
}

/** Renames the destination of the leg at `position`, as an edit of the route would. */
export async function renameDestination(
  tripId: string,
  position: number,
  name: string,
): Promise<void> {
  await client.execute({
    sql: "UPDATE trip_leg SET to_city_id = NULL, to_code = ?, to_name = ? WHERE trip_id = ? AND position = ?",
    args: [name.slice(0, 3).toUpperCase(), name, tripId, position],
  });
}
