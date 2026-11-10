import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import type { Activity } from "@/modules/itinerary/domain/activity";
import type { ActivitiesRepository, NewActivity } from "@/modules/itinerary/service/ports";
import { db } from "@/shared/db/client";
import { activity, activityParticipant } from "@/shared/db/schema/itinerary";

type Row = typeof activity.$inferSelect;

function toActivity(row: Row, participantIds: string[]): Activity {
  return {
    id: row.id,
    tripId: row.tripId,
    date: row.date,
    title: row.title,
    startTime: row.startTime,
    durationMinutes: row.durationMinutes,
    costPerPerson: row.costPerPerson,
    currency: row.currency,
    rate: row.rate,
    link: row.link,
    createdBy: row.createdBy,
    participantIds,
  };
}

/** `ActivitiesRepository` over `activity` + `activity_participant`. Two queries per list. */
export class DrizzleActivitiesRepository implements ActivitiesRepository {
  async listForTrip(tripId: string): Promise<Activity[]> {
    const rows = await db.select().from(activity).where(eq(activity.tripId, tripId));
    if (rows.length === 0) {
      return [];
    }
    const participants = await db
      .select()
      .from(activityParticipant)
      .where(
        inArray(
          activityParticipant.activityId,
          rows.map((row) => row.id),
        ),
      );
    return rows.map((row) =>
      toActivity(
        row,
        participants.filter((p) => p.activityId === row.id).map((p) => p.userId),
      ),
    );
  }

  async find(tripId: string, activityId: string): Promise<Activity | null> {
    const [row] = await db
      .select()
      .from(activity)
      .where(and(eq(activity.tripId, tripId), eq(activity.id, activityId)))
      .limit(1);
    if (row === undefined) {
      return null;
    }
    const participants = await db
      .select({ userId: activityParticipant.userId })
      .from(activityParticipant)
      .where(eq(activityParticipant.activityId, activityId));
    return toActivity(
      row,
      participants.map((p) => p.userId),
    );
  }

  async create(record: NewActivity, subscribeCreator: boolean): Promise<Activity> {
    await db.batch([
      db.insert(activity).values({ ...record, createdAt: new Date() }),
      ...(subscribeCreator
        ? [
            db
              .insert(activityParticipant)
              .values({ activityId: record.id, userId: record.createdBy }),
          ]
        : []),
    ] as never);
    return { ...record, participantIds: subscribeCreator ? [record.createdBy] : [] };
  }

  async update({ id, tripId, createdBy: _createdBy, ...fields }: NewActivity): Promise<void> {
    await db
      .update(activity)
      .set(fields)
      .where(and(eq(activity.tripId, tripId), eq(activity.id, id)));
  }

  async remove(tripId: string, activityId: string): Promise<void> {
    await db.delete(activity).where(and(eq(activity.tripId, tripId), eq(activity.id, activityId)));
  }

  async setSubscription(activityId: string, userId: string, subscribed: boolean): Promise<void> {
    if (subscribed) {
      await db.insert(activityParticipant).values({ activityId, userId }).onConflictDoNothing();
      return;
    }
    await db
      .delete(activityParticipant)
      .where(
        and(eq(activityParticipant.activityId, activityId), eq(activityParticipant.userId, userId)),
      );
  }
}
