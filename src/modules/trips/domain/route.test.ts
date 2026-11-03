import { describe, expect, it } from "vitest";
import { validateRoute } from "@/modules/trips/domain/route";
import type { CityRef, Leg } from "@/modules/trips/domain/trip";

const TODAY = "2026-10-26";

function city(name: string, cityId: string | null = null): CityRef {
  return { cityId, code: name.slice(0, 3).toUpperCase(), name };
}

function leg(from: CityRef, to: CityRef, date: string | null = null): Leg {
  return { from, to, date };
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

  describe("date rules", () => {
    const A = city("Bogotá");
    const B = city("Madrid");
    const C = city("Rome");
    const D = city("Paris");

    it("reports DATE_ORDER on a leg dated before the previous dated leg", () => {
      const legs = [leg(A, B, "2026-11-10"), leg(B, C, "2026-11-05")];

      expect(validateRoute({ legs, today: TODAY })).toEqual([{ legIndex: 1, rule: "DATE_ORDER" }]);
    });

    it("allows the same day on two legs", () => {
      const legs = [leg(A, B, "2026-11-10"), leg(B, C, "2026-11-10")];

      expect(validateRoute({ legs, today: TODAY })).toEqual([]);
    });

    it("skips undated legs between dated ones", () => {
      const legs = [leg(A, B, "2026-11-10"), leg(B, C), leg(C, D, "2026-11-12")];
      const late = [leg(A, B, "2026-11-10"), leg(B, C), leg(C, D, "2026-11-09")];

      expect(validateRoute({ legs, today: TODAY })).toEqual([]);
      expect(validateRoute({ legs: late, today: TODAY })).toEqual([
        { legIndex: 2, rule: "DATE_ORDER" },
      ]);
    });

    it("reports DATE_PAST for a date before today, accepts today", () => {
      expect(validateRoute({ legs: [leg(A, B, "2026-10-25")], today: TODAY })).toEqual([
        { legIndex: 0, rule: "DATE_PAST" },
      ]);
      expect(validateRoute({ legs: [leg(A, B, TODAY)], today: TODAY })).toEqual([]);
    });

    it("on update, keeps unchanged past dates and checks new or changed ones", () => {
      const previousLegs = [leg(A, B, "2026-10-01"), leg(B, C, "2026-10-02")];
      const unchanged = [leg(A, B, "2026-10-01"), leg(B, C, "2026-10-02")];
      const changed = [leg(A, B, "2026-10-01"), leg(B, C, "2026-10-03")];
      const added = [...unchanged, leg(C, D, "2026-10-04")];

      expect(validateRoute({ legs: unchanged, today: TODAY, previousLegs })).toEqual([]);
      expect(validateRoute({ legs: changed, today: TODAY, previousLegs })).toEqual([
        { legIndex: 1, rule: "DATE_PAST" },
      ]);
      expect(validateRoute({ legs: added, today: TODAY, previousLegs })).toEqual([
        { legIndex: 2, rule: "DATE_PAST" },
      ]);
    });
  });
});
