import "server-only";
import { randomUUID } from "node:crypto";
import { DrizzleActivitiesRepository } from "@/modules/itinerary/data/drizzle-activities-repository";
import type { TripContextReader } from "@/modules/itinerary/service/ports";
import {
  createActivity,
  deleteActivity,
  listActivities,
  setSubscription,
  subscribedCosts,
  updateActivity,
} from "@/modules/itinerary/service/use-cases";

export type { ItineraryMessages } from "@/modules/itinerary/messages/load";
export { loadItineraryMessages } from "@/modules/itinerary/messages/load";
export type { TripContext, TripContextReader } from "@/modules/itinerary/service/ports";
export type {
  ActivityDto,
  ActivityInput,
  ItineraryDto,
} from "@/modules/itinerary/service/schemas";
export { activityInputSchema } from "@/modules/itinerary/service/schemas";
export type { ItineraryError } from "@/modules/itinerary/service/use-cases";

type Args<F> = F extends (first: infer A, ...rest: never[]) => unknown ? A : never;

/** The itinerary API with the trips port injected by the app layer. */
export function createItineraryApi({ trips }: { trips: TripContextReader }) {
  const deps = {
    activities: new DrizzleActivitiesRepository(),
    trips,
    ids: { next: () => randomUUID() },
  };
  return {
    listActivities: (query: Args<typeof listActivities>) => listActivities(query, deps),
    createActivity: (command: Args<typeof createActivity>) => createActivity(command, deps),
    updateActivity: (command: Args<typeof updateActivity>) => updateActivity(command, deps),
    deleteActivity: (command: Args<typeof deleteActivity>) => deleteActivity(command, deps),
    setSubscription: (command: Args<typeof setSubscription>) => setSubscription(command, deps),
    subscribedCosts: (tripId: string) => subscribedCosts(tripId, deps),
  };
}
