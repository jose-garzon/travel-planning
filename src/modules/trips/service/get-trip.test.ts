import { describe, expect, it } from "vitest";
import type { Trip } from "@/modules/trips/domain/trip";
import { getTrip } from "@/modules/trips/service/get-trip";
import type { CityNames, TripEditRepository } from "@/modules/trips/service/ports";

const bogota = { cityId: null, code: "BOG", name: "Bogotá" };
const madrid = { cityId: null, code: "MAD", name: "Madrid" };

const stored: Trip = {
  id: "trip-1",
  name: "Europe",
  currency: "USD",
  version: 3,
  role: "owner",
  memberCount: 1,
  legs: [{ from: bogota, to: madrid, date: "2027-02-20" }],
};

const cities: CityNames = { localizeName: (city, locale) => `${city.name} (${locale})` };

function repository(trip: Trip | null): TripEditRepository {
  return {
    findForMember: async (tripId, userId) =>
      trip !== null && tripId === trip.id && userId === "user-1" ? trip : null,
    update: async () => null,
    remove: async () => {},
  };
}

describe("getTrip", () => {
  it("returns the trip of a member with names in the request locale", async () => {
    const result = await getTrip(
      { userId: "user-1", tripId: "trip-1", locale: "es" },
      { trips: repository(stored), cities },
    );

    expect(result).toMatchObject({ ok: true, value: { id: "trip-1", version: 3 } });
    expect(result.ok && result.value.legs[0]?.to.name).toBe("Madrid (es)");
  });

  it("answers TRIP_NOT_FOUND for a user who is not a member", async () => {
    const result = await getTrip(
      { userId: "stranger", tripId: "trip-1", locale: "en" },
      { trips: repository(stored), cities },
    );

    expect(result).toEqual({ ok: false, error: { code: "TRIP_NOT_FOUND" } });
  });
});
