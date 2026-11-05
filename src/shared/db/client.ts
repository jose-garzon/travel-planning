import "server-only";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { env } from "@/shared/config/env";
import * as schema from "./schema";

const client = createClient({
  url: env.DATABASE_URL,
  authToken: env.DATABASE_AUTH_TOKEN,
});

// Parallel writers (e2e workers, a join racing a save) wait for the lock
// instead of failing with SQLITE_BUSY. The local file client holds one
// connection, so the pragma applies to every later statement (the test
// clients await theirs; this one is fire-and-forget).
client.execute("PRAGMA busy_timeout = 5000;").catch(() => {});

export const db = drizzle(client, { schema });
export type Db = typeof db;
