import { describe, expect, it } from "vitest";
import { stopsFromLegs } from "@/modules/trips/domain/route-view";
import type { CityRef, Leg } from "@/modules/trips/domain/trip";

function city(name: string, code = name.slice(0, 3).toUpperCase()): CityRef {
  return { cityId: null, code, name };
}

function leg(from: CityRef, to: CityRef, date: string | null): Leg {
  return { from, to, date };
}

const bogota = city("Bogotá");
const madrid = city("Madrid");
const barcelona = city("Barcelona", "BCN");

describe("stopsFromLegs", () => {
  it("makes the first origin the takeoff and every destination a stop", () => {
    const view = stopsFromLegs([
      leg(bogota, madrid, "2027-03-10"),
      leg(madrid, barcelona, "2027-03-13"),
    ]);

    expect(view.takeoff).toMatchObject({ code: "BOG", name: "Bogotá", date: "2027-03-10" });
    expect(view.stops.map((stop) => stop.code)).toEqual(["MAD", "BCN"]);
    expect(view.backHome).toBeNull();
  });

  it("ends at back home when the last leg returns to the first origin", () => {
    const view = stopsFromLegs([
      leg(bogota, madrid, "2027-03-10"),
      leg(madrid, barcelona, "2027-03-13"),
      leg(barcelona, bogota, "2027-03-18"),
    ]);

    expect(view.stops.map((stop) => stop.code)).toEqual(["MAD", "BCN"]);
    expect(view.backHome).toMatchObject({ code: "BOG", date: "2027-03-18" });
  });

  it("gives each stop its arrival, departure and nights", () => {
    const view = stopsFromLegs([
      leg(bogota, madrid, "2027-03-10"),
      leg(madrid, barcelona, "2027-03-13"),
      leg(barcelona, bogota, "2027-03-18"),
    ]);

    expect(view.stops[0]).toMatchObject({
      arrive: "2027-03-10",
      depart: "2027-03-13",
      nights: 3,
    });
    expect(view.stops[1]).toMatchObject({ arrive: "2027-03-13", depart: "2027-03-18", nights: 5 });
  });

  it("leaves the last stop without departure or nights when the trip does not return", () => {
    const view = stopsFromLegs([leg(bogota, madrid, "2027-03-10")]);

    expect(view.stops[0]).toMatchObject({ arrive: "2027-03-10", depart: null, nights: null });
  });

  it("has no nights when either date is unknown", () => {
    const view = stopsFromLegs([leg(bogota, madrid, null), leg(madrid, barcelona, "2027-03-13")]);

    expect(view.stops[0]).toMatchObject({ arrive: null, depart: "2027-03-13", nights: null });
  });

  it("numbers stops from 1 and carries the total", () => {
    const view = stopsFromLegs([
      leg(bogota, madrid, null),
      leg(madrid, barcelona, null),
      leg(barcelona, bogota, null),
    ]);

    expect(view.stops.map((stop) => [stop.number, stop.total])).toEqual([
      [1, 2],
      [2, 2],
    ]);
  });

  it("recognizes the return home by city id when both are known cities", () => {
    const origin: CityRef = { cityId: "c1", code: "BOG", name: "Bogotá" };
    const view = stopsFromLegs([
      leg(origin, madrid, null),
      leg(madrid, { ...origin, name: "Bogota" }, null),
    ]);

    expect(view.backHome).not.toBeNull();
  });
});
