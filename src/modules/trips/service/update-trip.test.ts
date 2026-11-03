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
  currency: "COP",
  version: 2,
  role: "owner",
  memberCount: 1,
  legs: [{ from: bogota, to: madrid, date: "2026-01-10" }],
};

const input: TripInput = {
  name: "Europe 2027",
  currency: "COP",
  legs: [{ from: bogota, to: madrid, date: "2026-01-10" }],
};

const cities: CityNames = { localizeName: (city) => city.name };

function repository(found: Trip | null, updated: Trip | null) {
  return {
    findForUser: vi.fn(async (_tripId: string, userId: string) =>
      userId === "user-1" ? found : null,
    ),
    update: vi.fn(async () => updated),
    delete: vi.fn(async () => {}),
  } satisfies TripEditRepository;
}

const command = { tripId: "trip-1", userId: "user-1", locale: "en", today: "2026-10-26" } as const;

describe("updateTrip", () => {
  it("saves the change against the version the client read", async () => {
    const trips = repository(stored, { ...stored, name: input.name, version: 3 });

    const result = await updateTrip({ ...command, version: 2, input }, { trips, cities });

    expect(trips.update).toHaveBeenCalledWith(
      expect.objectContaining({ tripId: "trip-1", expectedVersion: 2, input }),
    );
    expect(result).toMatchObject({ ok: true, value: { name: "Europe 2027", version: 3 } });
  });

  it("keeps an unchanged date that has since passed", async () => {
    const trips = repository(stored, stored);

    const result = await updateTrip({ ...command, version: 2, input }, { trips, cities });

    expect(result.ok).toBe(true);
  });

  it("rejects a new past date", async () => {
    const trips = repository(stored, stored);
    const past: TripInput = {
      ...input,
      legs: [{ from: bogota, to: madrid, date: "2026-02-01" }],
    };

    const result = await updateTrip({ ...command, version: 2, input: past }, { trips, cities });

    expect(result).toEqual({
      ok: false,
      error: { code: "ROUTE_INVALID", violations: [{ legIndex: 0, rule: "DATE_PAST" }] },
    });
    expect(trips.update).not.toHaveBeenCalled();
  });

  it("answers not found when the caller is not a member", async () => {
    const trips = repository(stored, stored);

    const result = await updateTrip(
      { ...command, userId: "stranger", version: 2, input },
      { trips, cities },
    );

    expect(result).toEqual({ ok: false, error: { code: "TRIP_NOT_FOUND" } });
    expect(trips.update).not.toHaveBeenCalled();
  });

  it("answers forbidden when a member is not the owner", async () => {
    const trips = repository({ ...stored, role: "viewer" as never }, stored);

    const result = await updateTrip({ ...command, version: 2, input }, { trips, cities });

    expect(result).toEqual({ ok: false, error: { code: "TRIP_FORBIDDEN" } });
    expect(trips.update).not.toHaveBeenCalled();
  });

  it("answers a version conflict when the version is stale", async () => {
    const trips = repository(stored, null);

    const result = await updateTrip({ ...command, version: 1, input }, { trips, cities });

    expect(result).toEqual({ ok: false, error: { code: "TRIP_VERSION_CONFLICT" } });
  });
});
