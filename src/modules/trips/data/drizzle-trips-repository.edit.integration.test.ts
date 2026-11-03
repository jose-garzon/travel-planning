import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// `server-only` throws outside a Next.js server bundle; this test is plain Node.
vi.mock("server-only", () => ({}));

const bogota = { cityId: null, code: "BOG", name: "Bogotá" };
const madrid = { cityId: null, code: "MAD", name: "Madrid" };
const lima = { cityId: null, code: "LIM", name: "Lima" };

describe("DrizzleTripsRepository edit and delete", () => {
  let repository: InstanceType<
    typeof import("./drizzle-trips-repository")["DrizzleTripsRepository"]
  >;
  let db: typeof import("@/shared/db/client")["db"];

  beforeAll(async () => {
    const dir = mkdtempSync(join(tmpdir(), "trips-repo-edit-"));
    vi.stubEnv("DATABASE_URL", `file:${join(dir, "test.db")}`);

    ({ db } = await import("@/shared/db/client"));
    const { migrate } = await import("drizzle-orm/libsql/migrator");
    await migrate(db, { migrationsFolder: "./src/shared/db/migrations" });

    const { user } = await import("@/shared/db/schema/auth");
    const now = new Date();
    await db.insert(user).values({
      id: "owner-1",
      name: "Ana",
      email: "ana@example.com",
      createdAt: now,
      updatedAt: now,
    });

    const { DrizzleTripsRepository } = await import("./drizzle-trips-repository");
    repository = new DrizzleTripsRepository();
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  function seed() {
    return repository.create({
      ownerId: "owner-1",
      now: new Date(),
      input: { name: "Europe", currency: "COP", legs: [{ from: bogota, to: madrid, date: null }] },
    });
  }

  it("finds a trip for a member and not for anyone else", async () => {
    const { id } = await seed();

    expect(await repository.findForMember(id, "owner-1")).toMatchObject({ id, role: "owner" });
    expect(await repository.findForMember(id, "stranger")).toBeNull();
  });

  it("replaces name and legs and bumps the version", async () => {
    const { id } = await seed();

    const updated = await repository.update({
      tripId: id,
      expectedVersion: 1,
      now: new Date(),
      input: {
        name: "Peru",
        currency: "PEN",
        legs: [
          { from: lima, to: madrid, date: "2027-01-01" },
          { from: madrid, to: lima, date: null },
        ],
      },
    });

    expect(updated).toMatchObject({ name: "Peru", currency: "PEN", version: 2 });
    const reread = await repository.findForMember(id, "owner-1");
    expect(reread?.legs).toHaveLength(2);
    expect(reread?.version).toBe(2);
  });

  it("returns null and leaves the legs alone when the version is stale", async () => {
    const { id } = await seed();

    const updated = await repository.update({
      tripId: id,
      expectedVersion: 99,
      now: new Date(),
      input: { name: "Nope", currency: "COP", legs: [{ from: lima, to: lima, date: null }] },
    });

    expect(updated).toBeNull();
    const reread = await repository.findForMember(id, "owner-1");
    expect(reread).toMatchObject({ name: "Europe", version: 1 });
    expect(reread?.legs).toEqual([{ from: bogota, to: madrid, date: null }]);
  });

  it("deletes the trip with its members and legs", async () => {
    const { id } = await seed();

    await repository.remove(id);

    expect(await repository.findForMember(id, "owner-1")).toBeNull();
    const { tripLeg, tripMember } = await import("@/shared/db/schema/trips");
    const { eq } = await import("drizzle-orm");
    expect(await db.select().from(tripLeg).where(eq(tripLeg.tripId, id))).toEqual([]);
    expect(await db.select().from(tripMember).where(eq(tripMember.tripId, id))).toEqual([]);
  });
});
