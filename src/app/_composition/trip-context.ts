import "server-only";
import { createAgentApi } from "@/modules/agent";
import { createBudgetApi } from "@/modules/budget";
import { createItineraryApi } from "@/modules/itinerary";
import { getTripContext } from "@/modules/trips";

/** Trips adapted to the trip-context port of itinerary, budget and agent. */
const trips = { get: (tripId: string, userId: string) => getTripContext({ tripId, userId }) };

export const itinerary = createItineraryApi({ trips });

export const budget = createBudgetApi({
  trips,
  activityCosts: { forTrip: (tripId: string) => itinerary.subscribedCosts(tripId) },
});

export const agent = createAgentApi({
  trips: {
    get: (tripId: string, userId: string, locale: "en" | "es") =>
      getTripContext({ tripId, userId, locale }),
  },
});
