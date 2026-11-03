import { describe, expect, it } from "vitest";
import type { CityRef, Trip } from "@/modules/trips/domain/trip";
import { getHomeTrips } from "@/modules/trips/service/get-home-trips";
import type { CityNames, TripRepository } from "@/modules/trips/service/ports";

const TODAY = "2026-10-26";

function city(name: string): CityRef {
  return { cityId: null, code: name.slice(0, 3).toUpperCase(), name };
}

function trip(name: string, dates: Array<string | null>): Trip {
  return {
    id: name,
    name,
    currency: "USD",
    version: 1,
    role: "owner",
    memberCount: 1,
    legs: dates.map((date) => ({ from: city("Lima"), to: city("Cusco"), date })),
  };
}

function repositoryWith(trips: Trip[]): TripRepository {
  return { create: async () => trips[0] as Trip, listForUser: async () => trips };
}

const cities: CityNames = { localizeName: (cityRef) => cityRef.name };

async function homeTripsFor(trips: Trip[]) {
  return getHomeTrips(
    { userId: "user-1", locale: "en", today: TODAY },
    { trips: repositoryWith(trips), cities },
  );
}

describe("getHomeTrips", () => {
  it("returns no next trip and no other trips for a member without trips", async () => {
    expect(await homeTripsFor([])).toEqual({ nextTrip: null, otherTrips: [] });
  });

  it("picks the earliest upcoming trip as next and lists the rest by start date", async () => {
    const home = await homeTripsFor([
      trip("Later", ["2027-06-01", "2027-06-10"]),
      trip("Sooner", ["2027-03-03", "2027-03-10"]),
    ]);

    expect(home.nextTrip).toMatchObject({
      name: "Sooner",
      startDate: "2027-03-03",
      endDate: "2027-03-10",
    });
    expect(home.otherTrips.map((t) => t.name)).toEqual(["Later"]);
  });

  it("treats a trip without dates as upcoming", async () => {
    const home = await homeTripsFor([trip("Someday", [null])]);

    expect(home.nextTrip).toMatchObject({ name: "Someday", startDate: null, endDate: null });
  });

  it("keeps an ended trip under other trips and never as the next trip", async () => {
    const home = await homeTripsFor([
      trip("Old", ["2020-01-01", "2020-01-10"]),
      trip("Soon", ["2027-03-03"]),
    ]);

    expect(home.nextTrip?.name).toBe("Soon");
    expect(home.otherTrips.map((t) => t.name)).toEqual(["Old"]);
  });

  it("shows a past-only member the ended trips under other trips with no next trip", async () => {
    const home = await homeTripsFor([trip("Old", ["2020-01-01", "2020-01-10"])]);

    expect(home.nextTrip).toBeNull();
    expect(home.otherTrips.map((t) => t.name)).toEqual(["Old"]);
  });

  it("counts a trip ending today as still in progress", async () => {
    const home = await homeTripsFor([trip("Ends today", ["2026-10-20", TODAY])]);

    expect(home.nextTrip?.name).toBe("Ends today");
  });

  it("keeps a route that does not return as next until a day after its last leg", async () => {
    const home = await homeTripsFor([trip("Open", ["2026-10-20", "2026-10-25"])]);

    expect(home.nextTrip?.name).toBe("Open");
  });

  it("moves a route that does not return to other trips two days after its last leg", async () => {
    const home = await homeTripsFor([trip("Open", ["2026-10-20", "2026-10-24"])]);

    expect(home.nextTrip).toBeNull();
    expect(home.otherTrips.map((t) => t.name)).toEqual(["Open"]);
  });

  it("lets the next upcoming trip take over when the earliest has ended", async () => {
    const home = await homeTripsFor([
      trip("Old", ["2020-01-01", "2020-01-10"]),
      trip("Later", ["2027-06-01"]),
      trip("Sooner", ["2027-03-01"]),
    ]);

    expect(home.nextTrip?.name).toBe("Sooner");
    expect(home.otherTrips.map((t) => t.name)).toEqual(["Later", "Old"]);
  });
});
