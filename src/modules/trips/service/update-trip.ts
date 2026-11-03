import type { RouteViolation } from "@/modules/trips/domain/route";
import { validateRoute } from "@/modules/trips/domain/route";
import type { CityNames, TripEditRepository } from "@/modules/trips/service/ports";
import type { TripDto, TripInput } from "@/modules/trips/service/schemas";
import { toTripDto } from "@/modules/trips/service/schemas";
import type { Locale } from "@/shared/i18n/routing";
import type { Result } from "@/shared/kernel/result";
import { err, ok } from "@/shared/kernel/result";

export type UpdateTripCommand = {
  tripId: string;
  userId: string;
  locale: Locale;
  today: string;
  version: number;
  input: TripInput;
};

export type UpdateTripError =
  | { code: "TRIP_NOT_FOUND" }
  | { code: "TRIP_FORBIDDEN" }
  | { code: "TRIP_VERSION_CONFLICT" }
  | { code: "ROUTE_INVALID"; violations: RouteViolation[] };

/** Owner-only edit; saves only when `version` is still the stored one. */
export async function updateTrip(
  { tripId, userId, locale, today, version, input }: UpdateTripCommand,
  { trips, cities }: { trips: TripEditRepository; cities: CityNames },
): Promise<Result<TripDto, UpdateTripError>> {
  const current = await trips.findForUser(tripId, userId);
  if (current === null) {
    return err({ code: "TRIP_NOT_FOUND" });
  }
  if (current.role !== "owner") {
    return err({ code: "TRIP_FORBIDDEN" });
  }

  const violations = validateRoute({ legs: input.legs, today, previousLegs: current.legs });
  if (violations.length > 0) {
    return err({ code: "ROUTE_INVALID", violations });
  }

  const saved = await trips.update({ tripId, input, expectedVersion: version, now: new Date() });
  if (saved === null) {
    return err({ code: "TRIP_VERSION_CONFLICT" });
  }

  return ok(toTripDto(saved, (city) => cities.localizeName(city, locale)));
}
