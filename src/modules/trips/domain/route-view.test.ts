import { describe, expect, it } from "vitest";
import { stopsFromLegs } from "@/modules/trips/domain/route-view";
import type { CityRef, Leg } from "@/modules/trips/domain/trip";

function city(name: string): CityRef {
  return { cityId: null, code: name.slice(0, 3).toUpperCase(), name };
}

function leg(from: string, to: string, date: string | null): Leg {
  return { from: city(from), to: city(to), date };
}

describe("stopsFromLegs", () => {
  it("takes off from the first origin and lists every destination as a stop", () => {
    const view = stopsFromLegs([
      leg("Bogota", "Madrid", "2027-03-01"),
      leg("Madrid", "Barcelona", "2027-03-04"),
    ]);

    expect(view.takeoff).toEqual({ city: city("Bogota"), date: "2027-03-01" });
    expect(view.stops.map((stop) => stop.city.code)).toEqual(["MAD", "BAR"]);
    expect(view.backHome).toBeNull();
  });

  it("turns a final leg back to the origin into back home, not a stop", () => {
    const view = stopsFromLegs([
      leg("Bogota", "Madrid", "2027-03-01"),
      leg("Madrid", "Barcelona", "2027-03-04"),
      leg("Barcelona", "Bogota", "2027-03-09"),
    ]);

    expect(view.stops.map((stop) => stop.city.code)).toEqual(["MAD", "BAR"]);
    expect(view.backHome).toEqual({ city: city("Bogota"), date: "2027-03-09" });
  });

  it("numbers stops and counts their nights from arrival to the next leg", () => {
    const view = stopsFromLegs([
      leg("Bogota", "Madrid", "2027-03-01"),
      leg("Madrid", "Barcelona", "2027-03-04"),
      leg("Barcelona", "Bogota", "2027-03-09"),
    ]);

    expect(view.stops[0]).toMatchObject({
      position: 1,
      total: 2,
      arrive: "2027-03-01",
      depart: "2027-03-04",
      nights: 3,
    });
    expect(view.stops[1]).toMatchObject({ position: 2, total: 2, nights: 5 });
  });

  it("leaves nights empty when either date is unknown", () => {
    const view = stopsFromLegs([
      leg("Bogota", "Madrid", "2027-03-01"),
      leg("Madrid", "Rome", null),
    ]);

    expect(view.stops[0]?.nights).toBeNull();
    expect(view.stops[1]).toMatchObject({ arrive: null, depart: null, nights: null });
  });

  it("matches the home city by city id when both have one", () => {
    const bogota = { cityId: "c-bog", code: "BOG", name: "Bogota" };
    const view = stopsFromLegs([
      { from: bogota, to: city("Madrid"), date: null },
      { from: city("Madrid"), to: { ...bogota, name: "Bogotá" }, date: null },
    ]);

    expect(view.backHome).not.toBeNull();
    expect(view.stops).toHaveLength(1);
  });
});
