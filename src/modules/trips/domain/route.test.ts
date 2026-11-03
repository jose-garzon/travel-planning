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
    const bog = city("Bogotá", "bog");
    const mad = city("Madrid", "mad");
    const rom = city("Rome", "rom");

    it("accepts dates that are today or later and in order", () => {
      const legs = [leg(bog, mad, TODAY), leg(mad, rom, "2026-11-01")];

      expect(validateRoute({ legs, today: TODAY })).toEqual([]);
    });

    it("allows legs without a date between dated legs", () => {
      const legs = [leg(bog, mad, "2026-11-01"), leg(mad, rom), leg(rom, bog, "2026-11-05")];

      expect(validateRoute({ legs, today: TODAY })).toEqual([]);
    });

    it("allows two legs on the same day", () => {
      const legs = [leg(bog, mad, "2026-11-01"), leg(mad, rom, "2026-11-01")];

      expect(validateRoute({ legs, today: TODAY })).toEqual([]);
    });

    it("reports DATE_ORDER on a leg dated before the previous dated leg", () => {
      const legs = [leg(bog, mad, "2026-11-10"), leg(mad, rom, "2026-11-05")];

      expect(validateRoute({ legs, today: TODAY })).toEqual([{ legIndex: 1, rule: "DATE_ORDER" }]);
    });

    it("compares with the last dated leg, skipping undated ones", () => {
      const legs = [leg(bog, mad, "2026-11-10"), leg(mad, rom), leg(rom, bog, "2026-11-05")];

      expect(validateRoute({ legs, today: TODAY })).toEqual([{ legIndex: 2, rule: "DATE_ORDER" }]);
    });

    it("reports DATE_PAST on a date before today when creating", () => {
      const legs = [leg(bog, mad, "2026-10-25")];

      expect(validateRoute({ legs, today: TODAY })).toEqual([{ legIndex: 0, rule: "DATE_PAST" }]);
    });

    it("skips DATE_PAST for a date unchanged from the previous legs", () => {
      const previousLegs = [leg(bog, mad, "2026-10-01")];
      const legs = [leg(bog, mad, "2026-10-01")];

      expect(validateRoute({ legs, today: TODAY, previousLegs })).toEqual([]);
    });

    it("reports DATE_PAST for a changed or new past date on update", () => {
      const previousLegs = [leg(bog, mad, "2026-10-01")];
      const legs = [leg(bog, mad, "2026-10-02"), leg(mad, rom, "2026-10-03")];

      expect(validateRoute({ legs, today: TODAY, previousLegs })).toEqual([
        { legIndex: 0, rule: "DATE_PAST" },
        { legIndex: 1, rule: "DATE_PAST" },
      ]);
    });
  });
});
