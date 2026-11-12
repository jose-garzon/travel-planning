import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { Transfer } from "@/modules/transfers/domain/transfer";

const fixtures = vi.hoisted(() => ({ queryCount: 0 }));

// `server-only` throws outside a Next.js server bundle; this test is plain Node.
vi.mock("server-only", () => ({}));

// Counts every `execute`/`batch` call so the test can assert the list's
// query budget (feature 015 plan "Performance budgets") on the real stack.
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

function transfer(id: string, tripId: string, overrides: Partial<Transfer> = {}): Transfer {
  return {
    id,
    tripId,
    gap: 0,
    mode: "flight",
    from: "Bogotá",
    to: "Cartagena",
    departDate: "2027-03-15",
    departTime: "09:40",
    departTz: "America/Bogota",
    arriveDate: "2027-03-15",
    arriveTime: "11:05",
    arriveTz: "America/Bogota",
    cost: 18000,
    currency: "USD",
    rate: "4000",
    charge: "opt-in",
    bookingRef: "AV9512",
    link: "https://example.com/booking",
    notes: "Window seat",
    needsReview: false,
    version: 1,
    createdBy: "user-0",
    createdAt: T0,
    participantIds: [],
    ...overrides,
  };
}

describe("DrizzleTransfersRepository", () => {
  let repository: InstanceType<
    typeof import("./drizzle-transfers-repository")["DrizzleTransfersRepository"]
  >;
  let addParticipant: (transferId: string, userId: string) => Promise<void>;

  beforeAll(async () => {
    const dir = mkdtempSync(join(tmpdir(), "transfers-repo-"));
    vi.stubEnv("DATABASE_URL", `file:${join(dir, "test.db")}`);

    const { db } = await import("@/shared/db/client");
    const { migrate } = await import("drizzle-orm/libsql/migrator");
    await migrate(db, { migrationsFolder: "./src/shared/db/migrations" });

    const { user } = await import("@/shared/db/schema/auth");
    const { trip } = await import("@/shared/db/schema/trips");
    const { transferParticipant } = await import("@/shared/db/schema/transfers");
    const now = new Date(T0);
    await db.insert(user).values(
      ["user-0", "user-1", "user-2"].map((id) => ({
        id,
        name: id,
        email: `${id}@example.com`,
        createdAt: now,
        updatedAt: now,
      })),
    );
    for (const id of ["trip-a", "trip-b", "trip-empty"]) {
      await db
        .insert(trip)
        .values({ id, name: id, currency: "COP", createdAt: now, updatedAt: now });
    }
    addParticipant = async (transferId, userId) => {
      await db.insert(transferParticipant).values({ transferId, userId });
    };

    const { DrizzleTransfersRepository } = await import("./drizzle-transfers-repository");
    repository = new DrizzleTransfersRepository();
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it("stores a transfer and reads every field back", async () => {
    const created = await repository.create(transfer("t1", "trip-a"));

    expect(created).toEqual(transfer("t1", "trip-a"));
    expect(await repository.listForTrip("trip-a")).toEqual([transfer("t1", "trip-a")]);
  });

  it("keeps nullable fields null", async () => {
    const bare = transfer("t2", "trip-a", {
      gap: 1,
      mode: "bus",
      departTime: null,
      departTz: null,
      arriveDate: null,
      arriveTime: null,
      arriveTz: null,
      cost: null,
      currency: null,
      rate: null,
      charge: "all",
      bookingRef: null,
      link: null,
      notes: null,
      needsReview: true,
    });
    await repository.create(bare);

    const listed = await repository.listForTrip("trip-a");

    expect(listed.find((t) => t.id === "t2")).toEqual(bare);
  });

  it("lists the participants of each transfer", async () => {
    await addParticipant("t1", "user-1");
    await addParticipant("t1", "user-2");

    const listed = await repository.listForTrip("trip-a");

    expect(listed.find((t) => t.id === "t1")?.participantIds.sort()).toEqual(["user-1", "user-2"]);
    expect(listed.find((t) => t.id === "t2")?.participantIds).toEqual([]);
  });

  it("lists only the transfers of the asked trip", async () => {
    await repository.create(transfer("t3", "trip-b"));

    expect((await repository.listForTrip("trip-b")).map((t) => t.id)).toEqual(["t3"]);
    expect(await repository.listForTrip("trip-empty")).toEqual([]);
  });

  it("lists in at most two queries", async () => {
    fixtures.queryCount = 0;

    await repository.listForTrip("trip-a");

    expect(fixtures.queryCount).toBeLessThanOrEqual(2);
  });
});
