import type { RouteViolation } from "@/modules/trips/domain/route";
import { validateRoute } from "@/modules/trips/domain/route";
import type { CityNames, TripRepository } from "@/modules/trips/service/ports";
import type { TripDto, TripInput } from "@/modules/trips/service/schemas";
import { toTripDto } from "@/modules/trips/service/schemas";
import type { Locale } from "@/shared/i18n/routing";
import type { Result } from "@/shared/kernel/result";
import { err, ok } from "@/shared/kernel/result";

export type CreateTripCommand = {
  userId: string;
  locale: Locale;
  today: string;
  input: TripInput;
};

export type CreateTripDeps = { trips: TripRepository; cities: CityNames };

/** Saves a new trip owned by `userId` when its route is valid; otherwise returns the violations. */
export async function createTrip(
  { userId, locale, today, input }: CreateTripCommand,
  { trips, cities }: CreateTripDeps,
): Promise<Result<TripDto, RouteViolation[]>> {
  const violations = validateRoute({ legs: input.legs, today });
  if (violations.length > 0) {
    return err(violations);
  }

  const trip = await trips.create({ ownerId: userId, input, now: new Date() });

  return ok(toTripDto(trip, (city) => cities.localizeName(city, locale)));
}
