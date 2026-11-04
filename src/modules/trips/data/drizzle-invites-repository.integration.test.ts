import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const fixtures = vi.hoisted(() => ({ queryCount: 0 }));

// `server-only` throws outside a Next.js server bundle; this test is plain Node.
vi.mock("server-only", () => ({}));

// Counts every `execute`/`batch` call so the test can assert the join
// preview's query budget (feature 009 plan "Performance budgets").
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

const NOW = new Date("2027-01-01T10:00:00Z");
const DAY_MS = 24 * 60 * 60 * 1000;

describe("DrizzleInvitesRepository", () => {
  let repository: InstanceType<
    typeof import("./drizzle-invites-repository")["DrizzleInvitesRepository"]
  >;

  beforeAll(async () => {
    const dir = mkdtempSync(join(tmpdir(), "invites-repo-"));
    vi.stubEnv("DATABASE_URL", `file:${join(dir, "test.db")}`);

    const { db } = await import("@/shared/db/client");
    const { migrate } = await import("drizzle-orm/libsql/migrator");
    await migrate(db, { migrationsFolder: "./src/shared/db/migrations" });

    const { user } = await import("@/shared/db/schema/auth");
    const { trip, tripLeg, tripMember } = await import("@/shared/db/schema/trips");
    await db.insert(user).values({
      id: "owner-1",
      name: "Jose",
      email: "jose@example.com",
      createdAt: NOW,
      updatedAt: NOW,
    });
    await db.insert(trip).values({
      id: "trip-1",
      name: "Europe",
      currency: "USD",
      createdAt: NOW,
      updatedAt: NOW,
    });
    await db.insert(tripMember).values({
      tripId: "trip-1",
      userId: "owner-1",
      role: "owner",
      joinedAt: NOW,
    });
    await db.insert(tripLeg).values({
      id: "leg-1",
      tripId: "trip-1",
      position: 0,
      fromCode: "BOG",
      fromName: "Bogota",
      toCode: "MAD",
      toName: "Madrid",
      date: "2027-02-20",
    });

    const { DrizzleInvitesRepository } = await import("./drizzle-invites-repository");
    repository = new DrizzleInvitesRepository();
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  const link = (token: string) => ({
    tripId: "trip-1",
    token,
    createdAt: NOW,
    expiresAt: new Date(NOW.getTime() + 7 * DAY_MS),
  });

  it("stores the link and reads it back by trip and by token", async () => {
    const stored = await repository.insertIfAbsent(link("token-a"));

    expect(stored).toEqual(link("token-a"));
    expect(await repository.findForTrip("trip-1")).toEqual(link("token-a"));
    expect(await repository.findByToken("token-a")).toEqual(link("token-a"));
  });

  it("keeps the existing link when a second one is inserted for the same trip", async () => {
    const stored = await repository.insertIfAbsent(link("token-b"));

    expect(stored.token).toBe("token-a");
  });

  it("replaces the link: the old token no longer matches, the new one does", async () => {
    const replaced = await repository.replace(link("token-c"));

    expect(replaced.token).toBe("token-c");
    expect(await repository.findByToken("token-a")).toBeNull();
    expect(await repository.findByToken("token-c")).toEqual(link("token-c"));
  });

  it("answers null for an unknown token", async () => {
    expect(await repository.findByToken("nope")).toBeNull();
  });

  it("reads the join preview with trip, dates and member count in at most 2 queries", async () => {
    fixtures.queryCount = 0;
    const preview = await repository.findPreviewByToken("token-c");

    expect(preview).toEqual({
      tripId: "trip-1",
      tripName: "Europe",
      ownerId: "owner-1",
      startDate: "2027-02-20",
      endDate: "2027-02-20",
      memberCount: 1,
      expiresAt: link("token-c").expiresAt,
    });
    expect(fixtures.queryCount).toBeLessThanOrEqual(2);
  });

  it("answers null for the preview of an unknown token", async () => {
    expect(await repository.findPreviewByToken("nope")).toBeNull();
  });
});
