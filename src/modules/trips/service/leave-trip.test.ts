import { describe, expect, it } from "vitest";
import type { Member } from "@/modules/trips/domain/membership";
import { leaveTrip } from "@/modules/trips/service/leave-trip";
import type { MembersRepository } from "@/modules/trips/service/ports";

const joinedAt = new Date("2027-01-01T10:00:00Z");

const roster: Member[] = [
  { userId: "jose", role: "owner", joinedAt },
  { userId: "laura", role: "editor", joinedAt },
];

/** Members that answer `found` to `listForTrip` and record every `remove` call. */
function members(found: Member[]) {
  const removed: Array<{ tripId: string; userId: string }> = [];
  const repository: MembersRepository = {
    listForTrip: async () => found,
    addIfRoom: async () => "added",
    remove: async (tripId, userId) => {
      removed.push({ tripId, userId });
    },
  };

  return { repository, removed };
}

describe("leaveTrip", () => {
  it("removes the editor's own membership", async () => {
    const { repository, removed } = members(roster);

    const result = await leaveTrip({ userId: "laura", tripId: "trip-1" }, { members: repository });

    expect(removed).toEqual([{ tripId: "trip-1", userId: "laura" }]);
    expect(result).toEqual({ ok: true, value: undefined });
  });

  it("answers OWNER_CANNOT_LEAVE and keeps the owner when the owner leaves", async () => {
    const { repository, removed } = members(roster);

    const result = await leaveTrip({ userId: "jose", tripId: "trip-1" }, { members: repository });

    expect(result).toEqual({ ok: false, error: { code: "OWNER_CANNOT_LEAVE" } });
    expect(removed).toEqual([]);
  });

  it("answers TRIP_NOT_FOUND and removes nobody when the user is not on the trip", async () => {
    const { repository, removed } = members(roster);

    const result = await leaveTrip(
      { userId: "stranger", tripId: "trip-1" },
      { members: repository },
    );

    expect(result).toEqual({ ok: false, error: { code: "TRIP_NOT_FOUND" } });
    expect(removed).toEqual([]);
  });
});
