import type { Trip } from "@/modules/trips/domain/trip";
import type { TripsReader } from "@/modules/trips/service/ports";

export type HomeTripsSummary = {
  nextTrip: Trip | null;
  otherTrips: Trip[];
};

/**
 * T00 stub: `InMemoryTripsReader` always returns `[]` (plan D-4), so
 * this always resolves to the empty state. T03 replaces this body with
 * the real rule — first trip with a start date on or after today is
 * `nextTrip`, the rest are `otherTrips` — same call site, same port.
 */
export async function getHomeTripsSummary(
  email: string,
  tripsReader: TripsReader,
): Promise<HomeTripsSummary> {
  await tripsReader.listForEmail(email);

  return { nextTrip: null, otherTrips: [] };
}
