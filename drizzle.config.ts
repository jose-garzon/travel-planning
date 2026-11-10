import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "turso",
  schema: "./src/shared/db/schema",
  out: "./src/shared/db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:local.db",
    // drizzle-kit's turso dialect insists on a token; a local file ignores it.
    authToken: process.env.DATABASE_AUTH_TOKEN || "local",
  },
});
