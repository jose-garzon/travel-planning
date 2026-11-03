import { describe, expect, it } from "vitest";
import type { Trip } from "@/modules/trips/domain/trip";
import { getTrip } from "@/modules/trips/service/get-trip";
import type { CityNames, TripEditRepository } from "@/modules/trips/service/ports";

const bogota = { cityId: null, code: "BOG", name: "Bogotá" };
const madrid = { cityId: null, code: "MAD", name: "Madrid" };

const stored: Trip = {
  id: "trip-1",
  name: "Europe",
  currency: "COP",
  version: 3,
  role: "owner",
  memberCount: 1,
  legs: [{ from: bogota, to: madrid, date: "2027-02-20" }],
};

const cities: CityNames = { localizeName: (city, locale) => `${city.name} (${locale})` };

function repository(found: Trip | null): TripEditRepository {
  return {
    findForUser: async (tripId, userId) =>
      found !== null && tripId === found.id && userId === "user-1" ? found : null,
    update: async () => null,
    delete: async () => {},
  };
}

describe("getTrip", () => {
  it("returns the trip with city names in the request locale", async () => {
    const result = await getTrip(
      { tripId: "trip-1", userId: "user-1", locale: "es" },
      { trips: repository(stored), cities },
    );

    expect(result).toMatchObject({
      ok: true,
      value: { id: "trip-1", version: 3, legs: [{ from: { name: "Bogotá (es)" } }] },
    });
  });

  it("answers not found when the caller is not a member", async () => {
    const result = await getTrip(
      { tripId: "trip-1", userId: "stranger", locale: "en" },
      { trips: repository(stored), cities },
    );

    expect(result).toEqual({ ok: false, error: { code: "TRIP_NOT_FOUND" } });
  });
});
