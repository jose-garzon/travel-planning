import type { Trip } from "@/modules/trips/domain/trip";
import { tripDateRange } from "@/modules/trips/domain/trip";
import type { CityNames, TripRepository } from "@/modules/trips/service/ports";
import type { TripDto } from "@/modules/trips/service/schemas";
import { toTripDto } from "@/modules/trips/service/schemas";
import type { Locale } from "@/shared/i18n/routing";

export type HomeTrips = {
  nextTrip: TripDto | null;
  otherTrips: TripDto[];
};

export type GetHomeTripsQuery = { userId: string; locale: Locale; today: string };

// Sorts undated trips after dated ones (plain string comparison works
// on `YYYY-MM-DD`).
const UNDATED = "9999-99-99";

function startOf(dto: TripDto): string {
  return dto.startDate ?? UNDATED;
}

function hasEnded(dto: TripDto, today: string): boolean {
  return dto.endDate !== null && dto.endDate < today;
}

/**
 * The earliest trip that has not ended (upcoming, in progress or
 * undated) is `nextTrip`. Every other trip is under `otherTrips`:
 * upcoming ones by start date, then ended ones, most recent first.
 */
export async function getHomeTrips(
  { userId, locale, today }: GetHomeTripsQuery,
  { trips, cities }: { trips: TripRepository; cities: CityNames },
): Promise<HomeTrips> {
  const all: Trip[] = await trips.listForUser(userId);
  const dtos = all.map((trip) => toTripDto(trip, (city) => cities.localizeName(city, locale)));

  const upcoming = dtos
    .filter((dto) => !hasEnded(dto, today))
    .sort((a, b) => startOf(a).localeCompare(startOf(b)));
  const ended = dtos
    .filter((dto) => hasEnded(dto, today))
    .sort((a, b) => startOf(b).localeCompare(startOf(a)));

  const [nextTrip = null, ...otherUpcoming] = upcoming;

  return { nextTrip, otherTrips: [...otherUpcoming, ...ended] };
}
