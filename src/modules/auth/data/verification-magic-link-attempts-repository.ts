import "server-only";
import { and, gte, sql } from "drizzle-orm";
import type { MagicLinkAttemptsReader } from "@/modules/auth/service/ports";
import { db } from "@/shared/db/client";
import { verification } from "@/shared/db/schema/auth";

/**
 * `MagicLinkAttemptsReader` adapter (plan D-3): counts `verification`
 * rows Better Auth already writes per issued magic link, no new
 * table. `identifier` holds the (plain, per the plugin's default
 * `storeToken` option) issued token, not the email — the plugin
 * writes the email inside the JSON `value` column instead
 * (`node_modules/better-auth/dist/plugins/magic-link/index.mjs`,
 * `createVerificationValue`: `value: JSON.stringify({ email, name })`).
 * Matches on `json_extract(value, '$.email')` accordingly. One query
 * (plan.md "Performance budgets"; asserted in the sibling integration
 * test).
 */
export class VerificationMagicLinkAttemptsRepository implements MagicLinkAttemptsReader {
  async countRecent(email: string, sinceIso: string): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(verification)
      .where(
        and(
          sql`json_extract(${verification.value}, '$.email') = ${email}`,
          gte(verification.createdAt, new Date(sinceIso)),
        ),
      );

    return row?.count ?? 0;
  }
}
