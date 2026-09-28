import { describe, expect, it } from "vitest";
import type { Trip } from "@/modules/trips/domain/trip";
import { getHomeTripsSummary } from "@/modules/trips/service/get-home-trips-summary";
import type { TripsReader } from "@/modules/trips/service/ports";

/** `YYYY-MM-DD` (plan "Contracts") `days` from today, UTC. */
function isoDateOffsetByDays(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function fakeTripsReader(trips: Trip[]): TripsReader {
  return { listForEmail: async () => trips };
}

describe("getHomeTripsSummary", () => {
  it("returns no next trip and no other trips when the member has zero trips", async () => {
    const summary = await getHomeTripsSummary("member@example.com", fakeTripsReader([]));

    expect(summary).toEqual({ nextTrip: null, otherTrips: [] });
  });

  it("returns the trip as next trip when there is one upcoming trip", async () => {
    const trip: Trip = {
      name: "Colombia trip",
      startDate: isoDateOffsetByDays(5),
      endDate: isoDateOffsetByDays(10),
    };

    const summary = await getHomeTripsSummary("member@example.com", fakeTripsReader([trip]));

    expect(summary).toEqual({ nextTrip: trip, otherTrips: [] });
  });

  it("drops a past trip instead of listing it as another trip when mixed with an upcoming trip", async () => {
    const upcoming: Trip = {
      name: "Colombia trip",
      startDate: isoDateOffsetByDays(5),
      endDate: isoDateOffsetByDays(10),
    };
    const past: Trip = {
      name: "Old trip",
      startDate: isoDateOffsetByDays(-10),
      endDate: isoDateOffsetByDays(-5),
    };

    const summary = await getHomeTripsSummary(
      "member@example.com",
      fakeTripsReader([past, upcoming]),
    );

    expect(summary).toEqual({ nextTrip: upcoming, otherTrips: [] });
  });

  it("returns no next trip and no other trips when every trip is in the past (EC-4)", async () => {
    const past: Trip = {
      name: "Old trip",
      startDate: isoDateOffsetByDays(-10),
      endDate: isoDateOffsetByDays(-5),
    };

    const summary = await getHomeTripsSummary("member@example.com", fakeTripsReader([past]));

    expect(summary).toEqual({ nextTrip: null, otherTrips: [] });
  });

  it("orders two upcoming trips by start date, the earliest as next trip", async () => {
    const earlier: Trip = {
      name: "Colombia trip",
      startDate: isoDateOffsetByDays(5),
      endDate: isoDateOffsetByDays(10),
    };
    const later: Trip = {
      name: "Peru trip",
      startDate: isoDateOffsetByDays(20),
      endDate: isoDateOffsetByDays(25),
    };

    const summary = await getHomeTripsSummary(
      "member@example.com",
      fakeTripsReader([later, earlier]),
    );

    expect(summary).toEqual({ nextTrip: earlier, otherTrips: [later] });
  });
});
