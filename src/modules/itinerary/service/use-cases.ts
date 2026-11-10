import {
  type Activity,
  checkDate,
  costInTripCurrency,
  MAX_ACTIVITIES_PER_TRIP,
  overlappingIds,
  sortActivities,
} from "@/modules/itinerary/domain/activity";
import type {
  ActivitiesRepository,
  IdGenerator,
  NewActivity,
  TripContext,
  TripContextReader,
} from "@/modules/itinerary/service/ports";
import type { ActivityDto, ActivityInput, ItineraryDto } from "@/modules/itinerary/service/schemas";
import type { Result } from "@/shared/kernel/result";
import { err, ok } from "@/shared/kernel/result";

export type ItineraryDeps = {
  activities: ActivitiesRepository;
  trips: TripContextReader;
  ids: IdGenerator;
};

export type ItineraryError =
  | { code: "TRIP_NOT_FOUND" }
  | { code: "ACTIVITY_NOT_FOUND" }
  | { code: "ACTIVITY_OUTSIDE_TRIP" }
  | { code: "TOO_MANY_ACTIVITIES" };

function toDto(activity: Activity, viewerId: string, overlapping: Set<string>): ActivityDto {
  return {
    id: activity.id,
    date: activity.date,
    title: activity.title,
    startTime: activity.startTime,
    durationMinutes: activity.durationMinutes,
    costPerPerson: activity.costPerPerson,
    currency: activity.currency,
    rate: activity.rate,
    costInTripCurrency: costInTripCurrency(activity),
    link: activity.link,
    participantIds: activity.participantIds,
    subscribed: activity.participantIds.includes(viewerId),
    overlaps: overlapping.has(activity.id),
  };
}

function toRecord(
  id: string,
  tripId: string,
  createdBy: string,
  input: ActivityInput,
  context: TripContext,
): NewActivity {
  const currency = input.costPerPerson === null ? null : (input.currency ?? context.currency);
  return {
    id,
    tripId,
    date: input.date,
    title: input.title,
    startTime: input.startTime,
    durationMinutes: input.durationMinutes,
    costPerPerson: input.costPerPerson === null ? null : Math.round(input.costPerPerson * 100),
    currency,
    rate: currency === null ? null : currency === context.currency ? "1" : (input.rate ?? "1"),
    link: input.link,
    createdBy,
  };
}

/** Every activity of a trip in calendar order, with overlap flags (members only). */
export async function listActivities(
  { userId, tripId }: { userId: string; tripId: string },
  { activities, trips }: Pick<ItineraryDeps, "activities" | "trips">,
): Promise<Result<ItineraryDto, ItineraryError>> {
  const context = await trips.get(tripId, userId);
  if (context === null) {
    return err({ code: "TRIP_NOT_FOUND" });
  }
  // Participants who left the trip no longer count.
  const members = new Set(context.memberIds);
  const all = sortActivities(await activities.listForTrip(tripId)).map((a) => ({
    ...a,
    participantIds: a.participantIds.filter((id) => members.has(id)),
  }));
  const overlapping = overlappingIds(all);
  return ok({
    currency: context.currency,
    activities: all.map((a) => toDto(a, userId, overlapping)),
  });
}

/** Any member adds an activity; the creator is subscribed to it. */
export async function createActivity(
  { userId, tripId, input }: { userId: string; tripId: string; input: ActivityInput },
  { activities, trips, ids }: ItineraryDeps,
): Promise<Result<{ id: string }, ItineraryError>> {
  const context = await trips.get(tripId, userId);
  if (context === null) {
    return err({ code: "TRIP_NOT_FOUND" });
  }
  if (checkDate(input.date, context) !== null) {
    return err({ code: "ACTIVITY_OUTSIDE_TRIP" });
  }
  if ((await activities.listForTrip(tripId)).length >= MAX_ACTIVITIES_PER_TRIP) {
    return err({ code: "TOO_MANY_ACTIVITIES" });
  }
  const created = await activities.create(
    toRecord(ids.next(), tripId, userId, input, context),
    true,
  );
  return ok({ id: created.id });
}

/** Any member edits an activity (last write wins; the form reloads on focus). */
export async function updateActivity(
  {
    userId,
    tripId,
    activityId,
    input,
  }: { userId: string; tripId: string; activityId: string; input: ActivityInput },
  { activities, trips }: Pick<ItineraryDeps, "activities" | "trips">,
): Promise<Result<{ id: string }, ItineraryError>> {
  const context = await trips.get(tripId, userId);
  if (context === null) {
    return err({ code: "TRIP_NOT_FOUND" });
  }
  const existing = await activities.find(tripId, activityId);
  if (existing === null) {
    return err({ code: "ACTIVITY_NOT_FOUND" });
  }
  if (checkDate(input.date, context) !== null) {
    return err({ code: "ACTIVITY_OUTSIDE_TRIP" });
  }
  await activities.update(toRecord(activityId, tripId, existing.createdBy, input, context));
  return ok({ id: activityId });
}

export async function deleteActivity(
  { userId, tripId, activityId }: { userId: string; tripId: string; activityId: string },
  { activities, trips }: Pick<ItineraryDeps, "activities" | "trips">,
): Promise<Result<null, ItineraryError>> {
  const context = await trips.get(tripId, userId);
  if (context === null) {
    return err({ code: "TRIP_NOT_FOUND" });
  }
  if ((await activities.find(tripId, activityId)) === null) {
    return err({ code: "ACTIVITY_NOT_FOUND" });
  }
  await activities.remove(tripId, activityId);
  return ok(null);
}

/** A member joins or leaves an activity; only for themselves. */
export async function setSubscription(
  {
    userId,
    tripId,
    activityId,
    subscribed,
  }: { userId: string; tripId: string; activityId: string; subscribed: boolean },
  { activities, trips }: Pick<ItineraryDeps, "activities" | "trips">,
): Promise<Result<null, ItineraryError>> {
  const context = await trips.get(tripId, userId);
  if (context === null) {
    return err({ code: "TRIP_NOT_FOUND" });
  }
  if ((await activities.find(tripId, activityId)) === null) {
    return err({ code: "ACTIVITY_NOT_FOUND" });
  }
  await activities.setSubscription(activityId, userId, subscribed);
  return ok(null);
}

/** Per member, the sum of activity costs they subscribed to (trip-currency minor units). */
export async function subscribedCosts(
  tripId: string,
  { activities }: Pick<ItineraryDeps, "activities">,
): Promise<{ title: string; cost: number; participantIds: string[] }[]> {
  return (await activities.listForTrip(tripId))
    .filter((a) => a.costPerPerson !== null)
    .map((a) => ({
      title: a.title,
      cost: costInTripCurrency(a),
      participantIds: a.participantIds,
    }));
}
