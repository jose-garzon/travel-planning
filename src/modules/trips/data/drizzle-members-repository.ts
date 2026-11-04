import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { MAX_MEMBERS, type Member } from "@/modules/trips/domain/membership";
import type { AddMemberRecord, MembersRepository } from "@/modules/trips/service/ports";
import { db } from "@/shared/db/client";
import { tripMember } from "@/shared/db/schema/trips";

/** `MembersRepository` over the `trip_member` table (feature 009 plan "Data model"). */
export class DrizzleMembersRepository implements MembersRepository {
  /** One query: owner first, then by join date, at most `MAX_MEMBERS` rows. */
  async listForTrip(tripId: string): Promise<Member[]> {
    return db
      .select({
        userId: tripMember.userId,
        role: tripMember.role,
        joinedAt: tripMember.joinedAt,
      })
      .from(tripMember)
      .where(eq(tripMember.tripId, tripId))
      .orderBy(sql`case when ${tripMember.role} = 'owner' then 0 else 1 end`, tripMember.joinedAt)
      .limit(MAX_MEMBERS);
  }

  /**
   * One statement: the row is inserted only while the trip has fewer than
   * `MAX_MEMBERS` members, so the cap holds under concurrent joins (EC-3).
   * Zero rows written means either the user was already a member or the
   * trip is full; a second read tells them apart.
   */
  async addIfRoom({ tripId, userId, role, joinedAt }: AddMemberRecord) {
    const result = await db.run(sql`
      INSERT INTO trip_member (trip_id, user_id, role, joined_at)
      SELECT ${tripId}, ${userId}, ${role}, ${joinedAt.getTime()}
      WHERE (SELECT count(*) FROM trip_member WHERE trip_id = ${tripId}) < ${MAX_MEMBERS}
      ON CONFLICT (trip_id, user_id) DO NOTHING
    `);
    if (result.rowsAffected === 1) {
      return "added";
    }

    const [existing] = await db
      .select({ userId: tripMember.userId })
      .from(tripMember)
      .where(and(eq(tripMember.tripId, tripId), eq(tripMember.userId, userId)))
      .limit(1);

    return existing === undefined ? "full" : "already";
  }

  /** A no-op when the user is not a member. */
  async remove(tripId: string, userId: string): Promise<void> {
    await db
      .delete(tripMember)
      .where(and(eq(tripMember.tripId, tripId), eq(tripMember.userId, userId)));
  }
}
