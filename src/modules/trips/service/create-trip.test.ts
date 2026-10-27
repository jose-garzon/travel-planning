import { describe, expect, it, vi } from "vitest";
import type { Trip } from "@/modules/trips/domain/trip";
import { createTrip } from "@/modules/trips/service/create-trip";
import type { CityNames, TripRepository } from "@/modules/trips/service/ports";
import type { TripInput } from "@/modules/trips/service/schemas";

const bogota = { cityId: null, code: "BOG", name: "Bogotá" };
const madrid = { cityId: null, code: "MAD", name: "Madrid" };

const input: TripInput = {
  name: "Europe with friends",
  currency: "COP",
  legs: [{ from: bogota, to: madrid, date: "2027-02-20" }],
};

function fakeRepository(): TripRepository {
  return {
    create: vi.fn(
      async ({ input: saved }): Promise<Trip> => ({
        id: "trip-1",
        name: saved.name,
        currency: saved.currency,
        version: 1,
        role: "owner",
        memberCount: 1,
        legs: saved.legs,
      }),
    ),
    listForUser: vi.fn(async () => []),
  };
}

const cities: CityNames = {
  localizeName: (city, locale) => `${city.name} (${locale})`,
};

describe("createTrip", () => {
  it("saves the trip with the caller as its owner", async () => {
    const trips = fakeRepository();

    const result = await createTrip(
      { userId: "user-1", locale: "en", today: "2026-10-26", input },
      { trips, cities },
    );

    expect(trips.create).toHaveBeenCalledWith(
      expect.objectContaining({ ownerId: "user-1", input }),
    );
    expect(result).toMatchObject({
      ok: true,
      value: { id: "trip-1", role: "owner", memberCount: 1, version: 1 },
    });
  });

  it("returns the trip date range and city names localized to the request locale", async () => {
    const result = await createTrip(
      { userId: "user-1", locale: "es", today: "2026-10-26", input },
      { trips: fakeRepository(), cities },
    );

    expect(result).toMatchObject({
      ok: true,
      value: {
        startDate: "2027-02-20",
        endDate: "2027-02-20",
        legs: [{ from: { name: "Bogotá (es)" }, to: { name: "Madrid (es)" } }],
      },
    });
  });

  it("returns the route violations without saving when the route is invalid", async () => {
    const trips = fakeRepository();
    const sameCity: TripInput = { ...input, legs: [{ from: madrid, to: madrid, date: null }] };

    const result = await createTrip(
      { userId: "user-1", locale: "en", today: "2026-10-26", input: sameCity },
      { trips, cities },
    );

    expect(result).toEqual({ ok: false, error: [{ legIndex: 0, rule: "SAME_CITY" }] });
    expect(trips.create).not.toHaveBeenCalled();
  });
});
