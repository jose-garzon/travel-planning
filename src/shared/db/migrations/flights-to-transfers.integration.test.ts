import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@libsql/client";
import { describe, expect, it } from "vitest";

const DIR = join(process.cwd(), "src/shared/db/migrations");
const FLIGHTS_MIGRATION = "_flights_to_transfers.sql";
const NOW = Date.parse("2027-01-10T12:00:00Z");

function statements(file: string): string[] {
  return readFileSync(join(DIR, file), "utf8")
    .split("--> statement-breakpoint")
    .map((sql) => sql.trim())
    .filter((sql) => sql !== "");
}

describe("flights to transfers migration", () => {
  it("turns flight budget items into transfers without changing anyone's total", async () => {
    const files = readdirSync(DIR)
      .filter((name) => name.endsWith(".sql"))
      .sort();
    const migration = files.find((name) => name.endsWith(FLIGHTS_MIGRATION));
    expect(migration).toBeDefined();
    const before = files.slice(0, files.indexOf(migration as string));

    const client = createClient({ url: `file:${join(mkdtempSync(join(tmpdir(), "flights-")), "m.db")}` });
    for (const file of before) {
      for (const sql of statements(file)) {
        await client.execute(sql);
      }
    }

    const seed = [
      ...["ana", "ben"].map((id) => ({
        sql: "INSERT INTO user (id, name, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        args: [id, id, `${id}@example.com`, NOW, NOW],
      })),
      {
        sql: "INSERT INTO trip (id, name, currency, created_at, updated_at) VALUES ('trip', 'Trip', 'COP', ?, ?)",
        args: [NOW, NOW],
      },
      { sql: "INSERT INTO trip_member (trip_id, user_id, role, joined_at) VALUES ('trip', 'ana', 'owner', 1)", args: [] },
      { sql: "INSERT INTO trip_member (trip_id, user_id, role, joined_at) VALUES ('trip', 'ben', 'editor', 2)", args: [] },
      ...[
        [0, "Bogotá", "BOG", "Cartagena", "CTG", "2027-03-15"],
        [1, "Cartagena", "CTG", "Santa Marta", "SMR", null],
      ].map(([position, fromName, fromCode, toName, toCode, date]) => ({
        sql:
          "INSERT INTO trip_leg (id, trip_id, position, from_code, from_name, to_code, to_name, date) " +
          "VALUES (?, 'trip', ?, ?, ?, ?, ?, ?)",
        args: [`leg-${position}`, position, fromCode, fromName, toCode, toName, date] as (string | number | null)[],
      })),
      ...[
        ["flight-person", "flights", "AV 9512", 18000, "USD", "4000", "ana", 0],
        ["flight-shared", "flights", "Bus-air", 5000, "COP", "1", null, 1],
        ["flight-nostop", "flights", "Open jaw", 7000, "COP", "1", null, null],
        ["hotel", "lodging", "Hotel", 9000, "COP", "1", null, 0],
      ].map(([id, category, label, amount, currency, rate, userId, stop]) => ({
        sql:
          "INSERT INTO budget_item (id, trip_id, category, label, amount, currency, rate, user_id, stop, created_at) " +
          "VALUES (?, 'trip', ?, ?, ?, ?, ?, ?, ?, ?)",
        args: [id, category, label, amount, currency, rate, userId, stop, NOW] as (string | number | null)[],
      })),
    ];
    await client.batch(seed, "write");

    const totalBefore = async (member: string) =>
      Number(
        (
          await client.execute({
            sql:
              "SELECT SUM(ROUND(amount * rate)) AS total FROM budget_item " +
              "WHERE category = 'flights' AND (user_id IS NULL OR user_id = ?)",
            args: [member],
          })
        ).rows[0]?.total,
      );
    const expected = { ana: await totalBefore("ana"), ben: await totalBefore("ben") };

    for (const sql of statements(migration as string)) {
      await client.execute(sql);
    }

    const totalAfter = async (member: string) =>
      Number(
        (
          await client.execute({
            sql:
              "SELECT SUM(ROUND(t.cost * t.rate)) AS total FROM transfer t WHERE t.charge = 'all' " +
              "OR EXISTS (SELECT 1 FROM transfer_participant p WHERE p.transfer_id = t.id AND p.user_id = ? )",
            args: [member],
          })
        ).rows[0]?.total,
      );
    expect({ ana: await totalAfter("ana"), ben: await totalAfter("ben") }).toEqual(expected);

    const rows = (
      await client.execute(
        "SELECT id, gap, mode, from_name, to_name, depart_date, charge, notes, needs_review, created_by " +
          "FROM transfer ORDER BY id",
      )
    ).rows.map((row) => ({ ...row }));
    const byId = Object.fromEntries(rows.map((row) => [row.id, row]));
    expect(rows).toHaveLength(3);
    expect(byId["flight-person"]).toMatchObject({
      gap: 0,
      mode: "flight",
      from_name: "Bogotá",
      to_name: "Cartagena",
      depart_date: "2027-03-15",
      charge: "opt-in",
      notes: "AV 9512",
      needs_review: 0,
      created_by: "ana",
    });
    // A leg without a date: the item's creation day, flagged for review.
    expect(byId["flight-shared"]).toMatchObject({
      gap: 1,
      charge: "all",
      depart_date: "2027-01-10",
      needs_review: 1,
    });
    // No stop: gap 0, flagged for review.
    expect(byId["flight-nostop"]).toMatchObject({ gap: 0, charge: "all", needs_review: 1 });

    const participants = (await client.execute("SELECT transfer_id, user_id FROM transfer_participant")).rows;
    expect(participants.map((row) => ({ ...row }))).toEqual([{ transfer_id: "flight-person", user_id: "ana" }]);

    const left = await client.execute("SELECT id FROM budget_item");
    expect(left.rows.map((row) => row.id)).toEqual(["hotel"]);
  });
});
