import { describe, expect, it, vi } from "vitest";
import type { Trip } from "@/modules/trips/domain/trip";
import { deleteTrip } from "@/modules/trips/service/delete-trip";
import type { TripEditRepository } from "@/modules/trips/service/ports";

const stored: Trip = {
  id: "trip-1",
  name: "Europe",
  currency: "COP",
  version: 1,
  role: "owner",
  memberCount: 1,
  legs: [],
};

function repository(found: Trip | null) {
  return {
    findForUser: vi.fn(async (_tripId: string, userId: string) =>
      userId === "user-1" ? found : null,
    ),
    update: vi.fn(async () => null),
    delete: vi.fn(async () => {}),
  } satisfies TripEditRepository;
}

describe("deleteTrip", () => {
  it("deletes the trip for its owner", async () => {
    const trips = repository(stored);

    const result = await deleteTrip({ tripId: "trip-1", userId: "user-1" }, { trips });

    expect(result).toEqual({ ok: true, value: undefined });
    expect(trips.delete).toHaveBeenCalledWith("trip-1");
  });

  it("answers not found when the caller is not a member", async () => {
    const trips = repository(stored);

    const result = await deleteTrip({ tripId: "trip-1", userId: "stranger" }, { trips });

    expect(result).toEqual({ ok: false, error: { code: "TRIP_NOT_FOUND" } });
    expect(trips.delete).not.toHaveBeenCalled();
  });

  it("answers forbidden when a member is not the owner", async () => {
    const trips = repository({ ...stored, role: "viewer" as never });

    const result = await deleteTrip({ tripId: "trip-1", userId: "user-1" }, { trips });

    expect(result).toEqual({ ok: false, error: { code: "TRIP_FORBIDDEN" } });
    expect(trips.delete).not.toHaveBeenCalled();
  });
});
