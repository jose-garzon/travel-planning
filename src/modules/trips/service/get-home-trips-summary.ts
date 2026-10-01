import type { Trip } from "@/modules/trips/domain/trip";
import type { TripsReader } from "@/modules/trips/service/ports";

export type HomeTripsSummary = {
  nextTrip: Trip | null;
  otherTrips: Trip[];
};

/**
 * The earliest trip with a start date on or after today is `nextTrip`;
 * the remaining upcoming trips are `otherTrips`, ordered by start date
 * (plan "Contracts"). Past trips are dropped entirely, never surfaced
 * as an `otherTrip` — a past-only member gets the full empty state
 * (`nextTrip: null`, `otherTrips: []`), not a "last trip" card (EC-4).
 * `startDate`/`today` are `YYYY-MM-DD` strings (plan "Contracts"),
 * which compare correctly with plain string comparison.
 */
export async function getHomeTripsSummary(
  email: string,
  tripsReader: TripsReader,
): Promise<HomeTripsSummary> {
  const trips = await tripsReader.listForEmail(email);
  const today = new Date().toISOString().slice(0, 10);

  const upcomingTrips = trips
    .filter((trip) => trip.startDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const [nextTrip = null, ...otherTrips] = upcomingTrips;

  return { nextTrip, otherTrips };
}
