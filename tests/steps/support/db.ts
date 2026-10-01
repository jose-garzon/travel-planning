import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../../../src/shared/db/schema/auth";

/**
 * Direct DB access for e2e setup/assertions the UI has no route to:
 * reading a magic-link token to open it (no HTTP-visible way to read
 * a sent email, console-log only in dev/test), or backdating its
 * `expiresAt` to simulate the 15-minute expiry (@T02 scenarios EC-2,
 * AC-11, per the packet's "Scenarios" note). Bypasses
 * `shared/db/client.ts`'s `server-only` guard on purpose — that file
 * cannot be imported outside a Next server bundle, and this is
 * Playwright's Node process, not one.
 */
const client = createClient({
  url: process.env.DATABASE_URL ?? "file:local.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

// `fullyParallel` (playwright.config.ts) runs several @T02 scenarios at
// once, each opening its own connection to the same local SQLite file
// as `pnpm dev`'s own process. WAL lets readers and a writer overlap
// instead of racing for one lock; `busy_timeout` makes a real conflict
// wait briefly and retry instead of failing immediately with
// `SQLITE_BUSY`. No top-level `await` (this file is `require`d, not
// `import`ed, by playwright-bdd's step loader) — every exported query
// below waits on this same promise first instead.
const ready = Promise.all([
  client.execute("PRAGMA journal_mode = WAL"),
  client.execute("PRAGMA busy_timeout = 5000"),
]);

const drizzleDb = drizzle(client, { schema });

/** `testDb`, but only once the concurrency PRAGMAs above have applied. */
export async function withTestDb(): Promise<typeof drizzleDb> {
  await ready;
  return drizzleDb;
}

export const { user, session, verification } = schema;
