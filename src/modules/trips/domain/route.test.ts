import { describe, expect, it } from "vitest";
import { validateRoute } from "@/modules/trips/domain/route";
import type { CityRef, Leg } from "@/modules/trips/domain/trip";

const TODAY = "2026-10-26";

function city(name: string, cityId: string | null = null): CityRef {
  return { cityId, code: name.slice(0, 3).toUpperCase(), name };
}

function leg(from: CityRef, to: CityRef): Leg {
  return { from, to, date: null };
}

describe("validateRoute", () => {
  it("accepts a single leg between two different cities", () => {
    const legs = [leg(city("Bogotá"), city("Madrid"))];

    expect(validateRoute({ legs, today: TODAY })).toEqual([]);
  });

  it("reports NO_LEGS for an empty route", () => {
    expect(validateRoute({ legs: [], today: TODAY })).toEqual([
      { legIndex: null, rule: "NO_LEGS" },
    ]);
  });

  it("accepts 10 legs and reports TOO_MANY_LEGS for 11", () => {
    const hop = leg(city("Bogotá"), city("Madrid"));

    expect(validateRoute({ legs: Array(10).fill(hop), today: TODAY })).toEqual([]);
    expect(validateRoute({ legs: Array(11).fill(hop), today: TODAY })).toEqual([
      { legIndex: null, rule: "TOO_MANY_LEGS" },
    ]);
  });

  it("reports SAME_CITY on the leg whose From and To share a city id", () => {
    const legs = [
      leg(city("Bogotá", "bog"), city("Madrid", "mad")),
      leg(city("Madrid", "mad"), city("Madrid", "mad")),
    ];

    expect(validateRoute({ legs, today: TODAY })).toEqual([{ legIndex: 1, rule: "SAME_CITY" }]);
  });

  it("reports SAME_CITY for free text equal to From, ignoring case and spaces", () => {
    const legs = [leg(city("Bogotá"), city("  bogotá "))];

    expect(validateRoute({ legs, today: TODAY })).toEqual([{ legIndex: 0, rule: "SAME_CITY" }]);
  });

  it("allows the same city in different legs (BOG -> CTG -> BOG)", () => {
    const legs = [
      leg(city("Bogotá", "bog"), city("Cartagena", "ctg")),
      leg(city("Cartagena", "ctg"), city("Bogotá", "bog")),
    ];

    expect(validateRoute({ legs, today: TODAY })).toEqual([]);
  });
});
