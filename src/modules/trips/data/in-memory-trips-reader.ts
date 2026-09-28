import "server-only";
import type { Trip } from "@/modules/trips/domain/trip";
import type { TripsReader } from "@/modules/trips/service/ports";

// Fixed dates (plan D-4 never pins these down): "Colombia trip" must
// match the AC-14 i18n scenario's exact expected output ("Mar 3 - 10,
// 2027" / "3 - 10 mar 2027"), so its range is fixed rather than
// relative to today. 2027 stays comfortably "upcoming" for as long as
// this mocked fixture is expected to live (D-4: replaced by the real
// Trips feature). "Peru trip" only needs to sort after it.
const COLOMBIA_TRIP: Trip = {
  name: "Colombia trip",
  startDate: "2027-03-03",
  endDate: "2027-03-10",
};
const PERU_TRIP: Trip = { name: "Peru trip", startDate: "2027-06-01", endDate: "2027-06-10" };
// Always in the past, regardless of when this feature's mock runs.
const PAST_TRIP: Trip = { name: "Past trip", startDate: "2020-01-01", endDate: "2020-01-10" };

/**
 * Derives trips from the signed-in email (plan D-4, no `trips` table
 * this feature): `+trips` gets two upcoming trips (exercises `nextTrip`
 * and a non-empty `otherTrips`, AC-7), `+pasttrips` gets one trip
 * already in the past (exercises the empty state despite having a
 * trip, EC-4), everything else gets none (AC-8).
 */
export class InMemoryTripsReader implements TripsReader {
  async listForEmail(email: string): Promise<Trip[]> {
    if (email.includes("+trips")) {
      return [COLOMBIA_TRIP, PERU_TRIP];
    }

    if (email.includes("+pasttrips")) {
      return [PAST_TRIP];
    }

    return [];
  }
}
