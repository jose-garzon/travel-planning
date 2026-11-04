import { describe, expect, it } from "vitest";
import type { Member } from "@/modules/trips/domain/membership";
import type { MembersRepository } from "@/modules/trips/service/ports";
import { removeMember } from "@/modules/trips/service/remove-member";

const joinedAt = new Date("2027-01-01T10:00:00Z");

const roster: Member[] = [
  { userId: "jose", role: "owner", joinedAt },
  { userId: "laura", role: "editor", joinedAt },
  { userId: "ana", role: "editor", joinedAt },
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

describe("removeMember", () => {
  it("removes the editor when the owner removes them", async () => {
    const { repository, removed } = members(roster);

    const result = await removeMember(
      { userId: "jose", tripId: "trip-1", targetUserId: "laura" },
      { members: repository },
    );

    expect(removed).toEqual([{ tripId: "trip-1", userId: "laura" }]);
    expect(result).toEqual({ ok: true, value: undefined });
  });

  it("answers TRIP_FORBIDDEN and removes nobody when an editor removes another editor", async () => {
    const { repository, removed } = members(roster);

    const result = await removeMember(
      { userId: "laura", tripId: "trip-1", targetUserId: "ana" },
      { members: repository },
    );

    expect(result).toEqual({ ok: false, error: { code: "TRIP_FORBIDDEN" } });
    expect(removed).toEqual([]);
  });

  it("answers TRIP_NOT_FOUND when the caller is not on the trip", async () => {
    const { repository, removed } = members(roster);

    const result = await removeMember(
      { userId: "stranger", tripId: "trip-1", targetUserId: "laura" },
      { members: repository },
    );

    expect(result).toEqual({ ok: false, error: { code: "TRIP_NOT_FOUND" } });
    expect(removed).toEqual([]);
  });

  it("answers MEMBER_NOT_FOUND when the target is not on the trip", async () => {
    const { repository, removed } = members(roster);

    const result = await removeMember(
      { userId: "jose", tripId: "trip-1", targetUserId: "stranger" },
      { members: repository },
    );

    expect(result).toEqual({ ok: false, error: { code: "MEMBER_NOT_FOUND" } });
    expect(removed).toEqual([]);
  });

  it("answers TRIP_FORBIDDEN and keeps the owner when the target is the owner", async () => {
    const { repository, removed } = members(roster);

    const result = await removeMember(
      { userId: "jose", tripId: "trip-1", targetUserId: "jose" },
      { members: repository },
    );

    expect(result).toEqual({ ok: false, error: { code: "TRIP_FORBIDDEN" } });
    expect(removed).toEqual([]);
  });
});
