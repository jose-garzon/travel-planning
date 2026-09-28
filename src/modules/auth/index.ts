import "server-only";
import { getSessionCookie } from "better-auth/cookies";
import { and, eq, gt } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/modules/auth/data/better-auth";
import type { DisplayNameWriter } from "@/modules/auth/service/set-display-name";
import { setDisplayName as setDisplayNameUseCase } from "@/modules/auth/service/set-display-name";
import { db } from "@/shared/db/client";
import { session, user } from "@/shared/db/schema/auth";
import type { Result } from "@/shared/kernel/result";

export type { AuthMessages } from "@/modules/auth/messages/load";
export { loadAuthMessages } from "@/modules/auth/messages/load";
export { auth };

/**
 * Reads the bare session token from the request's cookies, or `null`
 * with no session cookie. `getSessionCookie` (better-auth/cookies)
 * returns the raw cookie value, which better-call signs as
 * `${token}.${signature}` (`setSignedCookie`, called by Better Auth's
 * own `setSessionCookie`); `session.token` in the DB is the bare value
 * before that signature (confirmed at
 * `node_modules/better-auth/dist/cookies/index.mjs`, not guessed —
 * AGENTS.md). Splitting on the first "." is safe: session tokens are
 * `generateRandomString(32, "a-z", "A-Z")`, which never contains one.
 */
async function getSessionToken(): Promise<string | null> {
  const rawCookie = getSessionCookie(await headers());
  if (rawCookie === null) {
    return null;
  }
  return rawCookie.split(".")[0] ?? rawCookie;
}

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
  const token = await getSessionToken();
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

/**
 * Sets the signed-in member's display name (plan "Contracts"):
 * validates via the domain rule, then persists `name` and
 * `nameConfirmedAt = now`. Only `app/[locale]/page.tsx`'s inline
 * Server Action calls this (architecture.md rule 7 — UI never calls
 * service/index.ts code directly). Throws if there is no active
 * session (this screen only ever renders for one) or on an
 * unexpected I/O failure.
 */
export async function setDisplayName(name: string): Promise<Result<void, "INVALID_NAME">> {
  const token = await getSessionToken();
  if (token === null) {
    throw new Error("setDisplayName: no active session");
  }

  const writer: DisplayNameWriter = {
    async setDisplayName(displayName, confirmedAt) {
      const [row] = await db
        .select({ userId: session.userId })
        .from(session)
        .where(eq(session.token, token))
        .limit(1);

      if (row === undefined) {
        throw new Error("setDisplayName: session not found");
      }

      await db
        .update(user)
        .set({ name: displayName, nameConfirmedAt: confirmedAt, updatedAt: confirmedAt })
        .where(eq(user.id, row.userId));
    },
  };

  return setDisplayNameUseCase(name, writer);
}
