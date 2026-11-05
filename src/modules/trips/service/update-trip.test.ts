import { describe, expect, it, vi } from "vitest";
import type { Trip } from "@/modules/trips/domain/trip";
import type { CityNames, TripEditRepository } from "@/modules/trips/service/ports";
import type { TripInput } from "@/modules/trips/service/schemas";
import { updateTrip } from "@/modules/trips/service/update-trip";

const bogota = { cityId: null, code: "BOG", name: "Bogotá" };
const madrid = { cityId: null, code: "MAD", name: "Madrid" };

const stored: Trip = {
  id: "trip-1",
  name: "Europe",
  currency: "USD",
  version: 2,
  role: "owner",
  memberCount: 1,
  legs: [{ from: bogota, to: madrid, date: "2026-10-01" }],
};

const input: TripInput = { name: "Europe 2027", currency: "USD", legs: stored.legs };
const cities: CityNames = { localizeName: (city) => city.name };
const TODAY = "2026-10-26";

function repository(
  trip: Trip | null,
  update: TripEditRepository["update"] = async ({ input: saved, expectedVersion }) =>
    trip === null ? null : { ...trip, ...saved, version: expectedVersion + 1 },
): TripEditRepository {
  return {
    findForMember: async (_tripId, userId) => (userId === "user-1" ? trip : null),
    update: vi.fn(update),
    remove: async () => {},
  };
}

const command = {
  userId: "user-1",
  tripId: "trip-1",
  locale: "en",
  today: TODAY,
  version: 2,
  input,
} as const;

describe("updateTrip", () => {
  it("saves the changes and returns the new version", async () => {
    const trips = repository(stored);

    const result = await updateTrip(command, { trips, cities });

    expect(result).toMatchObject({ ok: true, value: { name: "Europe 2027", version: 3 } });
  });

  it("does not flag an unchanged past date but flags a changed one", async () => {
    const trips = repository(stored);
    const moved = { ...input, legs: [{ ...stored.legs[0], date: "2026-09-01" }] } as TripInput;

    const result = await updateTrip({ ...command, input: moved }, { trips, cities });

    expect(result).toEqual({
      ok: false,
      error: { code: "ROUTE_INVALID", violations: [{ legIndex: 0, rule: "DATE_PAST" }] },
    });
  });

  it("answers TRIP_NOT_FOUND for a non-member without saving", async () => {
    const trips = repository(stored);

    const result = await updateTrip({ ...command, userId: "stranger" }, { trips, cities });

    expect(result).toEqual({ ok: false, error: { code: "TRIP_NOT_FOUND" } });
    expect(trips.update).not.toHaveBeenCalled();
  });

  it("saves the changes for an editor, who edits but does not manage (D-5)", async () => {
    const editor: Trip = { ...stored, role: "editor" };
    const trips = repository(editor);

    const result = await updateTrip(command, { trips, cities });

    expect(result).toMatchObject({ ok: true, value: { name: "Europe 2027", version: 3 } });
    expect(trips.update).toHaveBeenCalledTimes(1);
  });

  it("answers TRIP_VERSION_CONFLICT when the version is stale", async () => {
    const trips = repository(stored);

    const result = await updateTrip({ ...command, version: 1 }, { trips, cities });

    expect(result).toEqual({ ok: false, error: { code: "TRIP_VERSION_CONFLICT" } });
  });

  it("answers TRIP_VERSION_CONFLICT when the store rejects a concurrent write", async () => {
    const trips = repository(stored, async () => null);

    const result = await updateTrip(command, { trips, cities });

    expect(result).toEqual({ ok: false, error: { code: "TRIP_VERSION_CONFLICT" } });
  });
});
