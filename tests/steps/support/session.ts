import { randomUUID } from "node:crypto";
import { createClient } from "@libsql/client";
import type { Page } from "@playwright/test";
import { drizzle } from "drizzle-orm/libsql";
import { session, user } from "@/shared/db/schema/auth";

/**
 * A Drizzle client talking to the same SQLite file the dev server under
 * test reads/writes. `DATABASE_URL`/`DATABASE_AUTH_TOKEN` are read from
 * `process.env` directly (same default as `@/shared/config/env`),
 * because both that module and `@/shared/db/client` are `server-only`
 * and throw outside a Next.js server bundle — step definitions run in
 * plain Node, like Playwright itself.
 */
const client = createClient({
  url: process.env.DATABASE_URL ?? "file:local.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const testDb = drizzle(client, { schema: { session, user } });

// Playwright runs scenarios in parallel worker processes, each opening
// its own connection to the same local SQLite file; without this,
// concurrent seeding inserts intermittently fail with "database is
// locked" (SQLITE_BUSY) instead of waiting their turn.
const busyTimeoutReady = client.execute("PRAGMA busy_timeout = 5000;");

const SESSION_COOKIE_NAME = "better-auth.session_token";
const SESSION_TTL_MS = 60 * 60 * 1000;

type SignInOptions = {
  /**
   * Must be unique per call: scenarios run in parallel (testing.md
   * "each scenario sets up its own data") and this creates a real
   * `user` row keyed on the unique `email` column.
   */
  email: string;
  displayName: string;
};

/**
 * Seeds a signed-in session directly via the DB and adds its cookie to
 * `page`'s browser context — there is no UI sign-in flow for T03's
 * scenarios to drive (that's T01/T02's job). Seeds `nameConfirmedAt` so
 * `getCurrentUser` (T00, `src/modules/auth/index.ts`) never routes to
 * the name-capture screen, and a cookie matching exactly what
 * `getSessionCookie` (better-auth/cookies) reads: the raw session
 * token under `better-auth.session_token`, no signing.
 */
export async function signInAs(page: Page, { email, displayName }: SignInOptions): Promise<void> {
  await busyTimeoutReady;

  const now = new Date();
  const userId = randomUUID();
  const token = randomUUID();

  await testDb.insert(user).values({
    id: userId,
    name: displayName,
    email,
    emailVerified: true,
    nameConfirmedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  await testDb.insert(session).values({
    id: randomUUID(),
    userId,
    token,
    expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
    createdAt: now,
    updatedAt: now,
  });

  await page.context().addCookies([
    {
      name: SESSION_COOKIE_NAME,
      value: token,
      domain: "localhost",
      path: "/",
      sameSite: "Lax",
    },
  ]);
}
