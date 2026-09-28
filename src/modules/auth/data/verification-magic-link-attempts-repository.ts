import "server-only";
import { and, eq, gte, sql } from "drizzle-orm";
import type { MagicLinkAttemptsReader } from "@/modules/auth/service/ports";
import { db } from "@/shared/db/client";
import { verification } from "@/shared/db/schema/auth";

/**
 * `MagicLinkAttemptsReader` adapter (plan D-3): counts `verification`
 * rows Better Auth already writes per issued magic link, keyed by
 * `identifier` (email), no new table. One query (plan.md "Performance
 * budgets"; asserted in the sibling integration test).
 */
export class VerificationMagicLinkAttemptsRepository implements MagicLinkAttemptsReader {
  async countRecent(email: string, sinceIso: string): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(verification)
      .where(
        and(eq(verification.identifier, email), gte(verification.createdAt, new Date(sinceIso))),
      );

    return row?.count ?? 0;
  }
}
