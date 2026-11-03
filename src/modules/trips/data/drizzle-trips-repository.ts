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
  /** The trip with the member's role and its legs, or null for a missing trip or non-member. */
  async findForUser(tripId: string, userId: string): Promise<Trip | null> {
    const [row] = await db
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
      .where(and(eq(tripMember.tripId, tripId), eq(tripMember.userId, userId)));
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

  /**
   * One transaction: the version-guarded trip update, then the legs are
   * replaced. A stale version updates no row and nothing else is written.
   * Only an owner reaches this (the service checks), so the role is `owner`.
   */
  async update({ tripId, input, expectedVersion, now }: UpdateTripRecord): Promise<Trip | null> {
    const version = expectedVersion + 1;

    return db.transaction(async (tx) => {
      const updated = await tx
        .update(trip)
        .set({ name: input.name, currency: input.currency, version, updatedAt: now })
        .where(and(eq(trip.id, tripId), eq(trip.version, expectedVersion)))
        .returning({ id: trip.id });
      if (updated.length === 0) {
        return null;
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
      const [members] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(tripMember)
        .where(eq(tripMember.tripId, tripId));

      return {
        id: tripId,
        name: input.name,
        currency: input.currency,
        version,
        role: "owner" as const,
        memberCount: Number(members?.count ?? 1),
        legs: input.legs,
      };
    });
  }

  async delete(tripId: string): Promise<void> {
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
      db.insert(tripMember).values({ tripId: id, userId: ownerId, role: "owner" }),
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
