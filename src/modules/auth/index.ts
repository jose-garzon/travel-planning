import "server-only";
import { getSessionCookie } from "better-auth/cookies";
import { and, eq, gt } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/modules/auth/data/better-auth";
import { db } from "@/shared/db/client";
import { session, user } from "@/shared/db/schema/auth";

export type { AuthMessages } from "@/modules/auth/messages/load";
export { loadAuthMessages } from "@/modules/auth/messages/load";
export { auth };

/**
 * The signed-in member (plan "Contracts"). `email` is not part of the
 * literal Contracts JSON, but `page.tsx`'s signed-in branch needs it to
 * call `getHomeTripsSummary` (its port, `TripsReader.listForEmail`, and
 * T03's fixture, both key off email, plan D-4) — additive, no field
 * removed or renamed.
 */
export type CurrentUser = {
  id: string;
  displayName: string;
  email: string;
  needsDisplayName: boolean;
};

/**
 * Reads the signed-in member from the session cookie: one query (plan
 * "Performance budgets"; asserted in `index.integration.test.ts`).
 * `needsDisplayName` mirrors `nameConfirmedAt === null`, the single
 * source of truth for the name-capture screen — never inferred from an
 * empty `name` (illegal states, code.md #3).
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = getSessionCookie(await headers());
  if (token === null) {
    return null;
  }

  const [row] = await db
    .select({
      id: user.id,
      displayName: user.name,
      email: user.email,
      nameConfirmedAt: user.nameConfirmedAt,
    })
    .from(session)
    .innerJoin(user, eq(session.userId, user.id))
    .where(and(eq(session.token, token), gt(session.expiresAt, new Date())))
    .limit(1);

  if (row === undefined) {
    return null;
  }

  return {
    id: row.id,
    displayName: row.displayName,
    email: row.email,
    needsDisplayName: row.nameConfirmedAt === null,
  };
}
