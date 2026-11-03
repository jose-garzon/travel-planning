import { describe, expect, it } from "vitest";
import { currentStopIndex, daysBetween } from "@/modules/trips/domain/current-stop";
import { stopsFromLegs } from "@/modules/trips/domain/route-view";
import type { CityRef, Leg } from "@/modules/trips/domain/trip";

function city(name: string): CityRef {
  return { cityId: null, code: name.slice(0, 3).toUpperCase(), name };
}

function legs(...dates: Array<string | null>): Leg[] {
  const names = ["Bogotá", "Madrid", "Barcelona", "Rome", "Bogotá"];
  return dates.map((date, index) => ({
    from: city(names[index] as string),
    to: city(names[index + 1] as string),
    date,
  }));
}

function currentFor(dates: Array<string | null>, today: string) {
  return currentStopIndex({ view: stopsFromLegs(legs(...dates)), today });
}

describe("daysBetween", () => {
  it("counts whole days between two dates", () => {
    expect(daysBetween({ from: "2027-03-10", to: "2027-03-13" })).toBe(3);
  });

  it("is zero for the same day and negative when reversed", () => {
    expect(daysBetween({ from: "2027-03-10", to: "2027-03-10" })).toBe(0);
    expect(daysBetween({ from: "2027-03-13", to: "2027-03-10" })).toBe(-3);
  });

  it("counts across a month end", () => {
    expect(daysBetween({ from: "2027-02-27", to: "2027-03-02" })).toBe(3);
  });
});

describe("currentStopIndex", () => {
  const dates = ["2027-03-10", "2027-03-13", "2027-03-18"];

  it("is the first stop before the trip", () => {
    expect(currentFor(dates, "2027-01-01")).toBe(0);
  });

  it("is the stop whose stay includes today", () => {
    expect(currentFor(dates, "2027-03-10")).toBe(0);
    expect(currentFor(dates, "2027-03-12")).toBe(0);
    expect(currentFor(dates, "2027-03-13")).toBe(1);
    expect(currentFor(dates, "2027-03-17")).toBe(1);
  });

  it("is none after the last dated leg", () => {
    expect(currentFor(dates, "2027-03-19")).toBeNull();
  });

  it("is the first stop when every leg is undated", () => {
    expect(currentFor([null, null, null], "2027-03-12")).toBe(0);
  });

  it("never picks a stop without dates during the trip", () => {
    expect(currentFor(["2027-03-10", null, "2027-03-18"], "2027-03-14")).not.toBe(1);
  });

  it("is none for a route without stops", () => {
    expect(currentStopIndex({ view: stopsFromLegs([]), today: "2027-03-12" })).toBeNull();
  });
});
