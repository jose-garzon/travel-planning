import { describe, expect, it } from "vitest";
import { currentStopIndex, daysBetween, tripHasEnded } from "@/modules/trips/domain/current-stop";
import { stopsFromLegs } from "@/modules/trips/domain/route-view";
import type { CityRef, Leg } from "@/modules/trips/domain/trip";

function city(name: string): CityRef {
  return { cityId: null, code: name.slice(0, 3).toUpperCase(), name };
}

function leg(from: string, to: string, date: string | null): Leg {
  return { from: city(from), to: city(to), date };
}

const ROUND_TRIP = [
  leg("Bogota", "Madrid", "2027-03-10"),
  leg("Madrid", "Barcelona", "2027-03-13"),
  leg("Barcelona", "Bogota", "2027-03-18"),
];

function currentOn(legs: Leg[], today: string) {
  return currentStopIndex({ view: stopsFromLegs(legs), today });
}

describe("daysBetween", () => {
  it("counts whole days, negative when `to` is earlier", () => {
    expect(daysBetween({ from: "2027-03-10", to: "2027-03-13" })).toBe(3);
    expect(daysBetween({ from: "2027-03-13", to: "2027-03-10" })).toBe(-3);
    expect(daysBetween({ from: "2027-03-10", to: "2027-03-10" })).toBe(0);
  });

  it("is not thrown off by month ends or daylight saving", () => {
    expect(daysBetween({ from: "2027-02-27", to: "2027-03-02" })).toBe(3);
    expect(daysBetween({ from: "2027-03-27", to: "2027-03-29" })).toBe(2);
  });
});

describe("currentStopIndex", () => {
  it("is the first stop before the trip starts", () => {
    expect(currentOn(ROUND_TRIP, "2027-03-01")).toBe(0);
  });

  it("is the stop whose stay covers today", () => {
    expect(currentOn(ROUND_TRIP, "2027-03-10")).toBe(0);
    expect(currentOn(ROUND_TRIP, "2027-03-12")).toBe(0);
    expect(currentOn(ROUND_TRIP, "2027-03-13")).toBe(1);
  });

  it("is none after the trip is back home", () => {
    expect(currentOn(ROUND_TRIP, "2027-03-18")).toBeNull();
    expect(currentOn(ROUND_TRIP, "2027-04-01")).toBeNull();
  });

  it("stays on the last stop of a route that does not return", () => {
    const legs = [leg("Bogota", "Madrid", "2027-03-01"), leg("Madrid", "Rome", "2027-03-04")];

    expect(currentOn(legs, "2027-03-20")).toBe(1);
  });

  it("is the first stop when no leg has a date", () => {
    expect(
      currentOn([leg("Bogota", "Madrid", null), leg("Madrid", "Rome", null)], "2027-03-01"),
    ).toBe(0);
  });

  it("never picks an undated stop when other legs are dated", () => {
    const legs = [
      leg("Bogota", "Madrid", "2027-03-01"),
      leg("Madrid", "Rome", null),
      leg("Rome", "Paris", null),
    ];

    expect(currentOn(legs, "2027-03-05")).toBe(0);
  });

  it("is none for a route without stops", () => {
    expect(currentStopIndex({ view: stopsFromLegs([]), today: "2027-03-01" })).toBeNull();
  });
});

describe("tripHasEnded", () => {
  it("ends the day after a round trip is back home", () => {
    expect(tripHasEnded({ legs: ROUND_TRIP, today: "2027-03-18" })).toBe(false);
    expect(tripHasEnded({ legs: ROUND_TRIP, today: "2027-03-19" })).toBe(true);
  });

  it("gives a route that does not return one extra day at its last stop", () => {
    const legs = [leg("Bogota", "Madrid", "2027-03-01"), leg("Madrid", "Rome", "2027-03-04")];

    expect(tripHasEnded({ legs, today: "2027-03-05" })).toBe(false);
    expect(tripHasEnded({ legs, today: "2027-03-06" })).toBe(true);
  });

  it("never ends an undated trip", () => {
    expect(tripHasEnded({ legs: [leg("Bogota", "Madrid", null)], today: "2099-01-01" })).toBe(
      false,
    );
  });
});
