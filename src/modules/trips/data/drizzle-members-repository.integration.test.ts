import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const fixtures = vi.hoisted(() => ({ queryCount: 0 }));

// `server-only` throws outside a Next.js server bundle; this test is plain Node.
vi.mock("server-only", () => ({}));

// Counts every `execute`/`batch` call so the test can assert the members
// read's query budget (feature 009 plan "Performance budgets") on the real stack.
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

const T0 = new Date("2027-01-01T10:00:00Z").getTime();

describe("DrizzleMembersRepository", () => {
  let repository: InstanceType<
    typeof import("./drizzle-members-repository")["DrizzleMembersRepository"]
  >;

  beforeAll(async () => {
    const dir = mkdtempSync(join(tmpdir(), "members-repo-"));
    vi.stubEnv("DATABASE_URL", `file:${join(dir, "test.db")}`);

    const { db } = await import("@/shared/db/client");
    const { migrate } = await import("drizzle-orm/libsql/migrator");
    await migrate(db, { migrationsFolder: "./src/shared/db/migrations" });

    const { user } = await import("@/shared/db/schema/auth");
    const { trip } = await import("@/shared/db/schema/trips");
    const now = new Date(T0);
    const users = Array.from({ length: 40 }, (_, index) => ({
      id: `user-${index}`,
      name: `User ${index}`,
      email: `user-${index}@example.com`,
      createdAt: now,
      updatedAt: now,
    }));
    await db.insert(user).values(users);
    for (const id of ["trip-list", "trip-full", "trip-race"]) {
      await db
        .insert(trip)
        .values({ id, name: id, currency: "USD", createdAt: now, updatedAt: now });
    }

    const { DrizzleMembersRepository } = await import("./drizzle-members-repository");
    repository = new DrizzleMembersRepository();
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it("lists the owner first, then the other members by join date", async () => {
    await repository.addIfRoom({
      tripId: "trip-list",
      userId: "user-0",
      role: "owner",
      joinedAt: new Date(T0),
    });
    await repository.addIfRoom({
      tripId: "trip-list",
      userId: "user-2",
      role: "editor",
      joinedAt: new Date(T0 + 2000),
    });
    await repository.addIfRoom({
      tripId: "trip-list",
      userId: "user-1",
      role: "editor",
      joinedAt: new Date(T0 + 1000),
    });

    const members = await repository.listForTrip("trip-list");

    expect(members.map((member) => [member.userId, member.role])).toEqual([
      ["user-0", "owner"],
      ["user-1", "editor"],
      ["user-2", "editor"],
    ]);
    expect(members[1]?.joinedAt).toEqual(new Date(T0 + 1000));
  });

  it("lists nothing for a trip that does not exist", async () => {
    expect(await repository.listForTrip("no-such-trip")).toEqual([]);
  });

  it("answers already for a user who is a member, without adding them twice", async () => {
    const record = {
      tripId: "trip-list",
      userId: "user-0",
      role: "editor" as const,
      joinedAt: new Date(T0),
    };

    expect(await repository.addIfRoom(record)).toBe("already");
    expect(await repository.listForTrip("trip-list")).toHaveLength(3);
  });

  it("refuses a 21st member with full once the trip holds 20", async () => {
    for (let index = 0; index < 20; index++) {
      const result = await repository.addIfRoom({
        tripId: "trip-full",
        userId: `user-${index}`,
        role: index === 0 ? "owner" : "editor",
        joinedAt: new Date(T0 + index),
      });
      expect(result).toBe("added");
    }

    const result = await repository.addIfRoom({
      tripId: "trip-full",
      userId: "user-20",
      role: "editor",
      joinedAt: new Date(T0 + 100),
    });

    expect(result).toBe("full");
    expect(await repository.listForTrip("trip-full")).toHaveLength(20);
  });

  it("holds the cap when joins race: one of five concurrent joins takes the last seat", async () => {
    for (let index = 0; index < 19; index++) {
      await repository.addIfRoom({
        tripId: "trip-race",
        userId: `user-${index}`,
        role: index === 0 ? "owner" : "editor",
        joinedAt: new Date(T0 + index),
      });
    }

    const results = await Promise.all(
      [20, 21, 22, 23, 24].map((index) =>
        repository.addIfRoom({
          tripId: "trip-race",
          userId: `user-${index}`,
          role: "editor",
          joinedAt: new Date(T0 + 200 + index),
        }),
      ),
    );

    expect(results.filter((result) => result === "added")).toHaveLength(1);
    expect(results.filter((result) => result === "full")).toHaveLength(4);
    expect(await repository.listForTrip("trip-race")).toHaveLength(20);
  });

  it("removes a member from the trip", async () => {
    await repository.remove("trip-list", "user-1");

    const members = await repository.listForTrip("trip-list");

    expect(members.map((member) => member.userId)).toEqual(["user-0", "user-2"]);
  });

  it("lists the members in at most one query", async () => {
    fixtures.queryCount = 0;
    await repository.listForTrip("trip-full");

    expect(fixtures.queryCount).toBeLessThanOrEqual(1);
  });
});
