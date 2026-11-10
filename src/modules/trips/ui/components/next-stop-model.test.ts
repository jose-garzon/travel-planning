import { describe, expect, it } from "vitest";
import type { TripDto } from "@/modules/trips/service/schemas";
import { buildNextStop, type HomeActivity } from "@/modules/trips/ui/components/next-stop-model";

const city = (name: string) => ({ cityId: null, code: name.slice(0, 3).toUpperCase(), name });

const trip: TripDto = {
  id: "t1",
  name: "Spain",
  currency: "EUR",
  version: 1,
  role: "owner",
  memberCount: 3,
  startDate: "2027-03-03",
  endDate: "2027-03-10",
  legs: [
    { from: city("Bogotá"), to: city("Madrid"), date: "2027-03-03" },
    { from: city("Madrid"), to: city("Sevilla"), date: "2027-03-06" },
    { from: city("Sevilla"), to: city("Bogotá"), date: "2027-03-10" },
  ],
};

function activity(id: string, date: string, startTime: string | null = null): HomeActivity {
  return {
    id,
    date,
    title: id,
    startTime,
    durationMinutes: null,
    subscribed: false,
    goingCount: 0,
  };
}

describe("buildNextStop", () => {
  it("before the trip, spotlights the first day: the arrival city and its plan", () => {
    const stop = buildNextStop(
      trip,
      [activity("prado", "2027-03-03"), activity("tapas", "2027-03-04")],
      "2027-02-24",
    );

    expect(stop?.daysAway).toBe(7);
    expect(stop?.underway).toBe(false);
    expect(stop?.focus.city).toBe("Madrid");
    expect(stop?.focus.travel?.from).toBe("Bogotá");
    expect(stop?.focus.activities.map((a) => a.id)).toEqual(["prado"]);
    expect(stop?.later.map((d) => d.date)).toEqual(["2027-03-04"]);
  });

  it("during the trip, spotlights today in the city reached last", () => {
    const stop = buildNextStop(trip, [activity("alcazar", "2027-03-07")], "2027-03-07");

    expect(stop?.underway).toBe(true);
    expect(stop?.daysAway).toBe(0);
    expect(stop?.focus.city).toBe("Sevilla");
    expect(stop?.focus.travel).toBeNull();
  });

  it("keeps at most three later planned days, in order", () => {
    const later = ["2027-03-08", "2027-03-05", "2027-03-04", "2027-03-09"].map((date) =>
      activity(date, date),
    );

    const stop = buildNextStop(trip, later, "2027-03-01");

    expect(stop?.later.map((d) => d.date)).toEqual(["2027-03-04", "2027-03-05", "2027-03-08"]);
  });

  it("is null for an undated or ended trip", () => {
    expect(buildNextStop({ ...trip, startDate: null, endDate: null }, [], "2027-01-01")).toBeNull();
    expect(buildNextStop(trip, [], "2027-04-01")).toBeNull();
  });
});

describe("buildNextStop stations", () => {
  it("lists the whole line and places each day on it", () => {
    const stop = buildNextStop(trip, [activity("feria", "2027-03-07")], "2027-03-04");

    expect(stop?.stations.map((s) => s.name)).toEqual(["Bogotá", "Madrid", "Sevilla", "Bogotá"]);
    expect(stop?.focus.station).toBe(1);
    expect(stop?.later[0]?.station).toBe(2);
  });

  it("before any leg has arrived, puts the day at the first destination", () => {
    const stop = buildNextStop(trip, [], "2027-02-01");

    expect(stop?.focus.station).toBe(1);
  });
});
