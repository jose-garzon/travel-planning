import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const fixtures = vi.hoisted(() => ({ queryCount: 0 }));

// `server-only` throws outside a Next.js server bundle; this test is plain Node.
vi.mock("server-only", () => ({}));

// Counts every `execute`/`batch` call so the test can assert the home
// read's query budget (plan "Performance budgets") on the real stack.
vi.mock("@libsql/client", async () => {
  const actual = await vi.importActual<typeof import("@libsql/client")>("@libsql/client");
  return {
    ...actual,
    createClient: (config: Parameters<typeof actual.createClient>[0]) => {
      const real = actual.createClient(config);
      return new Proxy(real, {
        get(target, prop) {
          if (prop === "execute" || prop === "batch") {
            fixtures.queryCount += 1;
          }
          const value = Reflect.get(target, prop, target);
          return typeof value === "function" ? value.bind(target) : value;
        },
      });
    },
  };
});

const bogota = { cityId: null, code: "BOG", name: "Bogotá" };
const madrid = { cityId: null, code: "MAD", name: "Madrid" };
const lima = { cityId: null, code: "LIM", name: "Lima" };

describe("DrizzleTripsRepository", () => {
  let repository: InstanceType<
    typeof import("./drizzle-trips-repository")["DrizzleTripsRepository"]
  >;

  beforeAll(async () => {
    const dir = mkdtempSync(join(tmpdir(), "trips-repo-"));
    vi.stubEnv("DATABASE_URL", `file:${join(dir, "test.db")}`);

    const { db } = await import("@/shared/db/client");
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

  it("saves a trip with its owner and legs in order, then reads it back", async () => {
    const created = await repository.create({
      ownerId: "owner-1",
      now: new Date(),
      input: {
        name: "Europe",
        currency: "COP",
        legs: [
          { from: bogota, to: madrid, date: "2027-02-20" },
          { from: madrid, to: bogota, date: null },
        ],
      },
    });

    expect(created).toMatchObject({ name: "Europe", role: "owner", memberCount: 1, version: 1 });

    const trips = await repository.listForUser("owner-1");
    expect(trips).toHaveLength(1);
    expect(trips[0]?.legs).toEqual([
      { from: bogota, to: madrid, date: "2027-02-20" },
      { from: madrid, to: bogota, date: null },
    ]);
  });

  it("does not list trips of other users", async () => {
    expect(await repository.listForUser("nobody")).toEqual([]);
  });

  it("reads the home list with trips and legs in at most 2 queries", async () => {
    await repository.create({
      ownerId: "owner-1",
      now: new Date(),
      input: { name: "Peru", currency: "PEN", legs: [{ from: lima, to: lima, date: null }] },
    });

    fixtures.queryCount = 0;
    const trips = await repository.listForUser("owner-1");

    expect(trips.length).toBeGreaterThanOrEqual(2);
    expect(fixtures.queryCount).toBeLessThanOrEqual(2);
  });

  describe("edit and delete", () => {
    const input = {
      name: "Edit me",
      currency: "COP",
      legs: [{ from: bogota, to: madrid, date: null }],
    };

    it("finds a trip only for its members", async () => {
      const created = await repository.create({ ownerId: "owner-1", now: new Date(), input });

      expect(await repository.findForUser(created.id, "owner-1")).toMatchObject({
        id: created.id,
        role: "owner",
        legs: input.legs,
      });
      expect(await repository.findForUser(created.id, "nobody")).toBeNull();
    });

    it("replaces name and legs and bumps the version when the version matches", async () => {
      const created = await repository.create({ ownerId: "owner-1", now: new Date(), input });
      const next = {
        name: "Renamed",
        currency: "EUR",
        legs: [
          { from: bogota, to: lima, date: "2027-03-01" },
          { from: lima, to: madrid, date: null },
        ],
      };

      const updated = await repository.update({
        tripId: created.id,
        input: next,
        expectedVersion: 1,
        now: new Date(),
      });

      expect(updated).toMatchObject({
        name: "Renamed",
        currency: "EUR",
        version: 2,
        legs: next.legs,
      });
      expect(await repository.findForUser(created.id, "owner-1")).toMatchObject({
        version: 2,
        legs: next.legs,
      });
    });

    it("saves nothing and returns null when the version is stale", async () => {
      const created = await repository.create({ ownerId: "owner-1", now: new Date(), input });

      const updated = await repository.update({
        tripId: created.id,
        input: { ...input, name: "Stale" },
        expectedVersion: 7,
        now: new Date(),
      });

      expect(updated).toBeNull();
      expect(await repository.findForUser(created.id, "owner-1")).toMatchObject({
        name: "Edit me",
        version: 1,
      });
    });

    it("deletes the trip with its legs and members", async () => {
      const created = await repository.create({ ownerId: "owner-1", now: new Date(), input });

      await repository.delete(created.id);

      const { db } = await import("@/shared/db/client");
      const { tripLeg, tripMember } = await import("@/shared/db/schema/trips");
      const { eq } = await import("drizzle-orm");
      expect(await repository.findForUser(created.id, "owner-1")).toBeNull();
      expect(await db.select().from(tripLeg).where(eq(tripLeg.tripId, created.id))).toEqual([]);
      expect(await db.select().from(tripMember).where(eq(tripMember.tripId, created.id))).toEqual(
        [],
      );
    });
  });
});
