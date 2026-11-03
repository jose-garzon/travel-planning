import { randomUUID } from "node:crypto";
import { createClient } from "@libsql/client";

/**
 * Seeds real trips (plan D-6: the mocked `InMemoryTripsReader` is gone)
 * with plain SQL through the same SQLite file the dev server reads.
 * Plain SQL, not the Drizzle schema: `shared/db` is `server-only`
 * (see `session.ts`) and this runs in Playwright's Node process.
 */
const client = createClient({
  url: process.env.DATABASE_URL ?? "file:local.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const busyTimeoutReady = client.execute("PRAGMA busy_timeout = 5000;");

const DAY_MS = 24 * 60 * 60 * 1000;

/** A leg's date: whole days from today (UTC), a fixed `YYYY-MM-DD`, or none. */
export type SeedLeg = {
  from: string;
  to: string;
  dayOffset?: number;
  date?: string;
};

export type SeedTripOptions = {
  ownerEmail: string;
  name: string;
  currency: string;
  legs: SeedLeg[];
};

function legDate({ dayOffset, date }: SeedLeg): string | null {
  if (date !== undefined) {
    return date;
  }
  if (dayOffset === undefined) {
    return null;
  }
  return new Date(Date.now() + dayOffset * DAY_MS).toISOString().slice(0, 10);
}

// Airport codes the scenarios spell out (BOG, MAD, BCN, LIM, CUZ).
const KNOWN_CODES: Record<string, string> = {
  bogota: "BOG",
  madrid: "MAD",
  barcelona: "BCN",
  lima: "LIM",
  cusco: "CUZ",
};

function plain(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Free-text city: no id; a known airport code, else the first 3 letters (plan "Data model"). */
function cityColumns(name: string): [null, string, string] {
  return [null, KNOWN_CODES[plain(name)] ?? name.slice(0, 3).toUpperCase(), name];
}

/** Inserts a trip owned by the user with `ownerEmail` (must already exist). */
export async function seedTrip({
  ownerEmail,
  name,
  currency,
  legs,
}: SeedTripOptions): Promise<string> {
  await busyTimeoutReady;

  const owner = await client.execute({
    sql: "SELECT id FROM user WHERE email = ?",
    args: [ownerEmail],
  });
  const ownerId = owner.rows[0]?.id;
  if (typeof ownerId !== "string") {
    throw new Error(`seedTrip: no user with email ${ownerEmail}`);
  }

  const tripId = randomUUID();
  const now = Date.now();

  await client.batch(
    [
      {
        sql: "INSERT INTO trip (id, name, currency, version, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)",
        args: [tripId, name, currency, now, now],
      },
      {
        sql: "INSERT INTO trip_member (trip_id, user_id, role) VALUES (?, ?, 'owner')",
        args: [tripId, ownerId],
      },
      ...legs.map((leg, position) => ({
        sql:
          "INSERT INTO trip_leg (id, trip_id, position, from_city_id, from_code, from_name, " +
          "to_city_id, to_code, to_name, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        args: [
          randomUUID(),
          tripId,
          position,
          ...cityColumns(leg.from),
          ...cityColumns(leg.to),
          legDate(leg),
        ],
      })),
    ],
    "write",
  );

  return tripId;
}
