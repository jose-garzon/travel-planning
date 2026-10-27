import "server-only";
import { cityIndex } from "@/modules/trips/data/city-index";
import { DrizzleTripsRepository } from "@/modules/trips/data/drizzle-trips-repository";
import type { CreateTripCommand } from "@/modules/trips/service/create-trip";
import { createTrip as createTripUseCase } from "@/modules/trips/service/create-trip";
import type { GetHomeTripsQuery } from "@/modules/trips/service/get-home-trips";
import { getHomeTrips as getHomeTripsUseCase } from "@/modules/trips/service/get-home-trips";
import { toTripDto } from "@/modules/trips/service/schemas";
import type { Locale } from "@/shared/i18n/routing";

export type { RouteViolation } from "@/modules/trips/domain/route";
export type { TripsMessages } from "@/modules/trips/messages/load";
export { loadTripsMessages } from "@/modules/trips/messages/load";
export type { HomeTrips } from "@/modules/trips/service/get-home-trips";
export type { TripDto, TripInput } from "@/modules/trips/service/schemas";
export { tripInputSchema } from "@/modules/trips/service/schemas";

const deps = { trips: new DrizzleTripsRepository(), cities: cityIndex };

/** Saves a trip owned by `userId`, or returns the route violations (plan "Contracts"). */
export function createTrip(command: CreateTripCommand) {
  return createTripUseCase(command, deps);
}

/** Next trip and the other trips for the home page. */
export function getHomeTrips(query: GetHomeTripsQuery) {
  return getHomeTripsUseCase(query, deps);
}

/** Every trip of `userId`, newest first as stored (cursor paging is not needed yet). */
export async function listMyTrips({ userId, locale }: { userId: string; locale: Locale }) {
  const trips = await deps.trips.listForUser(userId);

  return trips.map((trip) => toTripDto(trip, (city) => deps.cities.localizeName(city, locale)));
}
