import type { RouteViolation } from "@/modules/trips/domain/route";
import { validateRoute } from "@/modules/trips/domain/route";
import type { CityNames, TripEditRepository } from "@/modules/trips/service/ports";
import type { TripDto, TripInput } from "@/modules/trips/service/schemas";
import { toTripDto } from "@/modules/trips/service/schemas";
import type { Locale } from "@/shared/i18n/routing";
import type { Result } from "@/shared/kernel/result";
import { err, ok } from "@/shared/kernel/result";

export type UpdateTripCommand = {
  userId: string;
  tripId: string;
  locale: Locale;
  today: string;
  /** The version the editor loaded; a newer stored version means someone else saved. */
  version: number;
  input: TripInput;
};

export type UpdateTripError =
  | { code: "TRIP_NOT_FOUND" }
  | { code: "TRIP_VERSION_CONFLICT" }
  | { code: "ROUTE_INVALID"; violations: RouteViolation[] };

export type UpdateTripDeps = { trips: TripEditRepository; cities: CityNames };

/** Saves changes to a trip for its owner or an editor (plan D-5), unless the route is invalid or the version is stale. */
export async function updateTrip(
  { userId, tripId, locale, today, version, input }: UpdateTripCommand,
  { trips, cities }: UpdateTripDeps,
): Promise<Result<TripDto, UpdateTripError>> {
  const current = await trips.findForMember(tripId, userId);
  if (current === null) {
    return err({ code: "TRIP_NOT_FOUND" });
  }

  const violations = validateRoute({ legs: input.legs, today, previousLegs: current.legs });
  if (violations.length > 0) {
    return err({ code: "ROUTE_INVALID", violations });
  }
  if (current.version !== version) {
    return err({ code: "TRIP_VERSION_CONFLICT" });
  }

  // The store re-checks the version atomically; null means a concurrent write won.
  const saved = await trips.update({ tripId, input, expectedVersion: version, now: new Date() });
  if (saved === null) {
    return err({ code: "TRIP_VERSION_CONFLICT" });
  }

  return ok(toTripDto(saved, (city) => cities.localizeName(city, locale)));
}
