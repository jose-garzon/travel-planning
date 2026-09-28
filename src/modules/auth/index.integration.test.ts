import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Shared with the mock factories below (vitest hoists `vi.mock`, so any
// state they read/write must come from `vi.hoisted`, not a plain
// top-level `let`/`const`).
const fixtures = vi.hoisted(() => ({
  sessionToken: "test-session-token",
  queryCount: 0,
}));

// `server-only` throws outside a Next.js Server Component bundle
// (its whole purpose); every file this test transitively imports
// (`index.ts`, `better-auth.ts`, `shared/db/client.ts`, `env.ts`) has
// one, so this integration test — plain Node, not a Next build — mocks
// the marker away.
vi.mock("server-only", () => ({}));

// Counts every `execute`/`batch` call the libsql client makes, so the
// test can assert `getCurrentUser`'s query-count budget (plan.md
// "Performance budgets": 1) against the real Drizzle + libsql stack,
// not a mock of our own schema/query code.
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

// `getCurrentUser` reads the session token from `next/headers` (App
// Router server-component API, unusable outside a request scope);
// mocked to hand back a fixed cookie instead of a real request.
vi.mock("next/headers", () => ({
  headers: async () =>
    new Headers({ cookie: `better-auth.session_token=${fixtures.sessionToken}` }),
}));

describe("getCurrentUser", () => {
  let getCurrentUser: typeof import("@/modules/auth")["getCurrentUser"];

  beforeAll(async () => {
    vi.stubEnv("DATABASE_URL", "file::memory:");

    const { db } = await import("@/shared/db/client");
    const { migrate } = await import("drizzle-orm/libsql/migrator");
    await migrate(db, { migrationsFolder: "./src/shared/db/migrations" });

    const { session, user } = await import("@/shared/db/schema/auth");
    const now = new Date();
    await db.insert(user).values({
      id: "user-1",
      name: "Ana",
      email: "ana@example.com",
      emailVerified: true,
      nameConfirmedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    await db.insert(session).values({
      id: "session-1",
      userId: "user-1",
      token: fixtures.sessionToken,
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
      createdAt: now,
      updatedAt: now,
    });

    ({ getCurrentUser } = await import("@/modules/auth"));
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it("reads the signed-in member issuing exactly 1 query", async () => {
    fixtures.queryCount = 0;

    const currentUser = await getCurrentUser();

    expect(currentUser).toEqual({
      id: "user-1",
      displayName: "Ana",
      email: "ana@example.com",
      needsDisplayName: false,
    });
    expect(fixtures.queryCount).toBe(1);
  });
});
