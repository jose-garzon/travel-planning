import { describe, expect, it, vi } from "vitest";
import type { Trip } from "@/modules/trips/domain/trip";
import { deleteTrip } from "@/modules/trips/service/delete-trip";
import type { TripEditRepository } from "@/modules/trips/service/ports";

const stored: Trip = {
  id: "trip-1",
  name: "Europe",
  currency: "USD",
  version: 1,
  role: "owner",
  memberCount: 1,
  legs: [],
};

function repository(trip: Trip | null): TripEditRepository {
  return {
    findForMember: async (_tripId, userId) => (userId === "user-1" ? trip : null),
    update: async () => null,
    remove: vi.fn(async () => {}),
  };
}

describe("deleteTrip", () => {
  it("deletes the trip for its owner", async () => {
    const trips = repository(stored);

    const result = await deleteTrip({ userId: "user-1", tripId: "trip-1" }, { trips });

    expect(result).toEqual({ ok: true, value: undefined });
    expect(trips.remove).toHaveBeenCalledWith("trip-1");
  });

  it("answers TRIP_NOT_FOUND for a non-member without deleting", async () => {
    const trips = repository(stored);

    const result = await deleteTrip({ userId: "stranger", tripId: "trip-1" }, { trips });

    expect(result).toEqual({ ok: false, error: { code: "TRIP_NOT_FOUND" } });
    expect(trips.remove).not.toHaveBeenCalled();
  });

  it("answers TRIP_FORBIDDEN for a member who is not the owner", async () => {
    const trips = repository({ ...stored, role: "viewer" } as unknown as Trip);

    const result = await deleteTrip({ userId: "user-1", tripId: "trip-1" }, { trips });

    expect(result).toEqual({ ok: false, error: { code: "TRIP_FORBIDDEN" } });
    expect(trips.remove).not.toHaveBeenCalled();
  });
});
