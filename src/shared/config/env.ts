import "server-only";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default("file:local.db"),
  DATABASE_AUTH_TOKEN: z.string().optional(),
  // Optional: Better Auth falls back to its own (insecure outside
  // production) defaults when unset, and infers `baseURL` from
  // `BETTER_AUTH_URL` itself. Kept optional so `pnpm dev` and tests
  // never need them (plan D-2: same reasoning as `RESEND_API_KEY`).
  BETTER_AUTH_SECRET: z.string().min(1).optional(),
  BETTER_AUTH_URL: z.string().min(1).optional(),
  // Required only in production (plan D-2); optional here so `pnpm dev`
  // doesn't break for everyone without a Resend account.
  RESEND_API_KEY: z.string().min(1).optional(),
});

export const env = envSchema.parse(process.env);
