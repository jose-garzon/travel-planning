import { describe, expect, it } from "vitest";
import type { Member } from "@/modules/trips/domain/membership";
import { getTripAccess } from "@/modules/trips/service/get-trip-access";
import type { MembersRepository } from "@/modules/trips/service/ports";

const roster: Member[] = [
  { userId: "jose", role: "owner", joinedAt: new Date("2027-01-01T10:00:00Z") },
];

function members(found: Member[]): MembersRepository {
  return {
    listForTrip: async () => found,
    addIfRoom: async () => "added",
    remove: async () => {},
  };
}

describe("getTripAccess", () => {
  it("answers member for a user on the trip", async () => {
    const access = await getTripAccess(
      { userId: "jose", tripId: "trip-1" },
      { members: members(roster) },
    );

    expect(access).toBe("member");
  });

  it("answers not-member for a trip the user is not on", async () => {
    const access = await getTripAccess(
      { userId: "stranger", tripId: "trip-1" },
      { members: members(roster) },
    );

    expect(access).toBe("not-member");
  });

  it("answers missing when the trip has no members", async () => {
    const access = await getTripAccess(
      { userId: "jose", tripId: "gone" },
      { members: members([]) },
    );

    expect(access).toBe("missing");
  });
});
