import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Shared with the mock factories below (vitest hoists `vi.mock`, so any
// state they read/write must come from `vi.hoisted`, not a plain
// top-level `let`/`const`); same pattern as
// `modules/auth/index.integration.test.ts`.
const fixtures = vi.hoisted(() => ({
  queryCount: 0,
  // Fixed reference instant (not `Date.now()` at test time) so seeding
  // and the assertion's `sinceIso` never drift relative to each other.
  nowMs: Date.parse("2026-01-01T12:00:00.000Z"),
}));

// `server-only` throws outside a Next.js Server Component bundle;
// every file this test transitively imports has one, so this
// integration test — plain Node, not a Next build — mocks it away.
vi.mock("server-only", () => ({}));

// Counts every `execute`/`batch` call the libsql client makes, so the
// test can assert `countRecent`'s query-count budget (plan.md
// "Performance budgets": 1) against the real Drizzle + libsql stack.
vi.mock("@libsql/client", async () => {
  const actual = await vi.importActual<typeof import("@libsql/client")>("@libsql/client");
  return {
    ...actual,
    createClient: (config: Parameters<typeof actual.createClient>[0]) => {
      const real = actual.createClient(config);
      return new Proxy(real, {
        get(target, prop, _receiver) {
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

describe("VerificationMagicLinkAttemptsRepository", () => {
  let VerificationMagicLinkAttemptsRepository: typeof import("./verification-magic-link-attempts-repository")["VerificationMagicLinkAttemptsRepository"];

  beforeAll(async () => {
    vi.stubEnv("DATABASE_URL", "file::memory:");

    const { db } = await import("@/shared/db/client");
    const { migrate } = await import("drizzle-orm/libsql/migrator");
    await migrate(db, { migrationsFolder: "./src/shared/db/migrations" });

    const { verification } = await import("@/shared/db/schema/auth");
    const now = new Date(fixtures.nowMs);
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    // Shaped like the real rows Better Auth's magic-link plugin
    // writes (`createVerificationValue` in
    // `node_modules/better-auth/dist/plugins/magic-link/index.mjs`):
    // `identifier` is the issued token (a random string, never the
    // email), and `value` is a JSON string with the email inside.
    // Using a plain `identifier: email` here (the plan's ERD comment
    // had it backwards) would let a regression back to the old
    // `identifier`-based query pass this test unnoticed.
    await db.insert(verification).values([
      {
        id: "verification-recent-1",
        identifier: "token-recent-1",
        value: JSON.stringify({ email: "ana@example.com", name: null }),
        createdAt: new Date(fifteenMinutesAgo.getTime() + 60 * 1000),
        updatedAt: new Date(fifteenMinutesAgo.getTime() + 60 * 1000),
        expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
      },
      {
        id: "verification-recent-2",
        identifier: "token-recent-2",
        value: JSON.stringify({ email: "ana@example.com", name: null }),
        createdAt: now,
        updatedAt: now,
        expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
      },
      // Outside the caller's `sinceIso` window: must not be counted.
      {
        id: "verification-old",
        identifier: "token-old",
        value: JSON.stringify({ email: "ana@example.com", name: null }),
        createdAt: thirtyMinutesAgo,
        updatedAt: thirtyMinutesAgo,
        expiresAt: new Date(thirtyMinutesAgo.getTime() + 60 * 60 * 1000),
      },
      // A different email entirely: must not be counted either.
      {
        id: "verification-other-email",
        identifier: "token-other-email",
        value: JSON.stringify({ email: "ben@example.com", name: null }),
        createdAt: now,
        updatedAt: now,
        expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
      },
    ]);

    ({ VerificationMagicLinkAttemptsRepository } = await import(
      "./verification-magic-link-attempts-repository"
    ));
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it("counts only the rows for that email created at or after sinceIso, issuing exactly 1 query", async () => {
    fixtures.queryCount = 0;
    const repository = new VerificationMagicLinkAttemptsRepository();

    const sinceIso = new Date(fixtures.nowMs - 15 * 60 * 1000).toISOString();
    const recentCount = await repository.countRecent("ana@example.com", sinceIso);

    expect(recentCount).toBe(2);
    expect(fixtures.queryCount).toBe(1);
  });
});
