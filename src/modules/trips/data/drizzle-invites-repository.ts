import "server-only";
import { eq, sql } from "drizzle-orm";
import type { Invite } from "@/modules/trips/domain/invite";
import type { InvitePreviewRecord, InvitesRepository } from "@/modules/trips/service/ports";
import { db } from "@/shared/db/client";
import { trip, tripInvite, tripLeg, tripMember } from "@/shared/db/schema/trips";

/** `InvitesRepository` over the `trip_invite` table (feature 009 plan "Data model"). */
export class DrizzleInvitesRepository implements InvitesRepository {
  async findForTrip(tripId: string): Promise<Invite | null> {
    const [row] = await db.select().from(tripInvite).where(eq(tripInvite.tripId, tripId)).limit(1);

    return row ?? null;
  }

  async findByToken(token: string): Promise<Invite | null> {
    const [row] = await db.select().from(tripInvite).where(eq(tripInvite.token, token)).limit(1);

    return row ?? null;
  }

  /** One query: the link, its trip, the member count, owner and the first and last dated legs. */
  async findPreviewByToken(token: string): Promise<InvitePreviewRecord | null> {
    const [row] = await db
      .select({
        tripId: trip.id,
        tripName: trip.name,
        expiresAt: tripInvite.expiresAt,
        memberCount: sql<number>`(select count(*) from ${tripMember} as m where m.trip_id = ${trip.id})`,
        ownerId: sql<string>`(select m.user_id from ${tripMember} as m where m.trip_id = ${trip.id} and m.role = 'owner' limit 1)`,
        startDate: sql<
          string | null
        >`(select l.date from ${tripLeg} as l where l.trip_id = ${trip.id} and l.date is not null order by l.position limit 1)`,
        endDate: sql<
          string | null
        >`(select l.date from ${tripLeg} as l where l.trip_id = ${trip.id} and l.date is not null order by l.position desc limit 1)`,
      })
      .from(tripInvite)
      .innerJoin(trip, eq(tripInvite.tripId, trip.id))
      .where(eq(tripInvite.token, token))
      .limit(1);

    return row === undefined ? null : { ...row, memberCount: Number(row.memberCount) };
  }

  /** Stores the link unless the trip has one; the stored link is returned either way. */
  async insertIfAbsent(invite: Invite): Promise<Invite> {
    await db.insert(tripInvite).values(invite).onConflictDoNothing({ target: tripInvite.tripId });
    const stored = await this.findForTrip(invite.tripId);
    if (stored === null) {
      throw new Error(`insertIfAbsent: no invite stored for trip ${invite.tripId}`);
    }

    return stored;
  }

  /** One upsert: the trip's row takes the new token, so the old one stops matching. */
  async replace(invite: Invite): Promise<Invite> {
    await db
      .insert(tripInvite)
      .values(invite)
      .onConflictDoUpdate({
        target: tripInvite.tripId,
        set: { token: invite.token, createdAt: invite.createdAt, expiresAt: invite.expiresAt },
      });

    return invite;
  }
}
