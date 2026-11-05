import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import type { CityRef, Leg, Trip } from "@/modules/trips/domain/trip";
import type {
  CreateTripRecord,
  TripEditRepository,
  TripRepository,
  UpdateTripRecord,
} from "@/modules/trips/service/ports";
import { db } from "@/shared/db/client";
import { trip, tripLeg, tripMember } from "@/shared/db/schema/trips";

type LegRow = typeof tripLeg.$inferSelect;

function toLeg(row: LegRow): Leg {
  const from: CityRef = { cityId: row.fromCityId, code: row.fromCode, name: row.fromName };
  const to: CityRef = { cityId: row.toCityId, code: row.toCode, name: row.toName };

  return { from, to, date: row.date };
}

/** `TripRepository` adapter over Drizzle (plan "Data model"). */
export class DrizzleTripsRepository implements TripRepository, TripEditRepository {
  /** The trip with the member's role and its legs, or null when missing or not a member. */
  async findForMember(tripId: string, userId: string): Promise<Trip | null> {
    const rows = await db
      .select({
        id: trip.id,
        name: trip.name,
        currency: trip.currency,
        version: trip.version,
        role: tripMember.role,
        memberCount: sql<number>`(select count(*) from ${tripMember} as m where m.trip_id = ${trip.id})`,
      })
      .from(tripMember)
      .innerJoin(trip, eq(tripMember.tripId, trip.id))
      .where(and(eq(tripMember.userId, userId), eq(trip.id, tripId)));
    const row = rows[0];
    if (row === undefined) {
      return null;
    }

    const legRows = await db
      .select()
      .from(tripLeg)
      .where(eq(tripLeg.tripId, tripId))
      .orderBy(tripLeg.position);

    return { ...row, memberCount: Number(row.memberCount), legs: legRows.map(toLeg) };
  }

  /** One transaction: the version-guarded update, then the legs are replaced; stale rolls back. */
  async update({ tripId, input, expectedVersion, now }: UpdateTripRecord): Promise<Trip | null> {
    const isSaved = await db.transaction(async (tx) => {
      const updated = await tx
        .update(trip)
        .set({
          name: input.name,
          currency: input.currency,
          version: expectedVersion + 1,
          updatedAt: now,
        })
        .where(and(eq(trip.id, tripId), eq(trip.version, expectedVersion)))
        .returning({ id: trip.id });
      if (updated.length === 0) {
        return false;
      }

      await tx.delete(tripLeg).where(eq(tripLeg.tripId, tripId));
      await tx.insert(tripLeg).values(
        input.legs.map((leg, position) => ({
          id: randomUUID(),
          tripId,
          position,
          fromCityId: leg.from.cityId,
          fromCode: leg.from.code,
          fromName: leg.from.name,
          toCityId: leg.to.cityId,
          toCode: leg.to.code,
          toName: leg.to.name,
          date: leg.date,
        })),
      );
      return true;
    });
    if (!isSaved) {
      return null;
    }

    const [owner] = await db
      .select({ userId: tripMember.userId })
      .from(tripMember)
      .where(eq(tripMember.tripId, tripId));

    return owner ? this.findForMember(tripId, owner.userId) : null;
  }

  /** Members and legs go with the trip (`ON DELETE CASCADE`). */
  async remove(tripId: string): Promise<void> {
    await db.delete(trip).where(eq(trip.id, tripId));
  }

  /** One atomic batch: trip, owner membership and all legs, or nothing. */
  async create({ ownerId, input, now }: CreateTripRecord): Promise<Trip> {
    const id = randomUUID();
    const statements: [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]] = [
      db.insert(trip).values({
        id,
        name: input.name,
        currency: input.currency,
        createdAt: now,
        updatedAt: now,
      }),
      db.insert(tripMember).values({ tripId: id, userId: ownerId, role: "owner", joinedAt: now }),
      ...input.legs.map((leg, position) =>
        db.insert(tripLeg).values({
          id: randomUUID(),
          tripId: id,
          position,
          fromCityId: leg.from.cityId,
          fromCode: leg.from.code,
          fromName: leg.from.name,
          toCityId: leg.to.cityId,
          toCode: leg.to.code,
          toName: leg.to.name,
          date: leg.date,
        }),
      ),
    ];
    await db.batch(statements);

    return {
      id,
      name: input.name,
      currency: input.currency,
      version: 1,
      role: "owner",
      memberCount: 1,
      legs: input.legs,
    };
  }

  /** Two queries: the user's trips (with member counts), then all their legs. */
  async listForUser(userId: string): Promise<Trip[]> {
    const trips = await db
      .select({
        id: trip.id,
        name: trip.name,
        currency: trip.currency,
        version: trip.version,
        role: tripMember.role,
        memberCount: sql<number>`(select count(*) from ${tripMember} as m where m.trip_id = ${trip.id})`,
      })
      .from(tripMember)
      .innerJoin(trip, eq(tripMember.tripId, trip.id))
      .where(eq(tripMember.userId, userId));

    if (trips.length === 0) {
      return [];
    }

    const legRows = await db
      .select()
      .from(tripLeg)
      .where(
        inArray(
          tripLeg.tripId,
          trips.map((row) => row.id),
        ),
      )
      .orderBy(tripLeg.tripId, tripLeg.position);

    return trips.map((row) => ({
      ...row,
      memberCount: Number(row.memberCount),
      legs: legRows.filter((leg) => leg.tripId === row.id).map(toLeg),
    }));
  }
}
