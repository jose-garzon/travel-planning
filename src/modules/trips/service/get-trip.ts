import type { CityNames, TripEditRepository } from "@/modules/trips/service/ports";
import type { TripDto } from "@/modules/trips/service/schemas";
import { toTripDto } from "@/modules/trips/service/schemas";
import type { Locale } from "@/shared/i18n/routing";
import type { Result } from "@/shared/kernel/result";
import { err, ok } from "@/shared/kernel/result";

export type GetTripQuery = { tripId: string; userId: string; locale: Locale };

/** One trip for a member; a missing trip and a non-member look the same. */
export async function getTrip(
  { tripId, userId, locale }: GetTripQuery,
  { trips, cities }: { trips: TripEditRepository; cities: CityNames },
): Promise<Result<TripDto, { code: "TRIP_NOT_FOUND" }>> {
  const trip = await trips.findForUser(tripId, userId);
  if (trip === null) {
    return err({ code: "TRIP_NOT_FOUND" });
  }

  return ok(toTripDto(trip, (city) => cities.localizeName(city, locale)));
}
