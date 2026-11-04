import { describe, expect, it, vi } from "vitest";
import type { Member } from "@/modules/trips/domain/membership";
import { listTripMembers } from "@/modules/trips/service/list-trip-members";
import type { MembersRepository, UserProfiles } from "@/modules/trips/service/ports";

const owner: Member = { userId: "jose", role: "owner", joinedAt: new Date("2027-01-01T10:00:00Z") };
const laura: Member = {
  userId: "laura",
  role: "editor",
  joinedAt: new Date("2027-01-02T10:00:00Z"),
};

const profiles: Record<string, { name: string; email: string }> = {
  jose: { name: "Jose", email: "jose@example.com" },
  laura: { name: "Laura", email: "laura@example.com" },
};

function members(roster: Member[]): MembersRepository {
  return {
    listForTrip: async () => roster,
    addIfRoom: async () => "added",
    remove: async () => {},
  };
}

function userProfiles(): UserProfiles & { getMany: ReturnType<typeof vi.fn> } {
  return {
    getMany: vi.fn(async (ids: string[]) =>
      ids.map((id) => ({ id, ...profiles[id] }) as { id: string; name: string; email: string }),
    ),
  };
}

describe("listTripMembers", () => {
  it("returns the members in roster order with names, emails and join dates", async () => {
    const result = await listTripMembers(
      { userId: "jose", tripId: "trip-1" },
      { members: members([owner, laura]), profiles: userProfiles() },
    );

    expect(result).toEqual({
      ok: true,
      value: [
        {
          userId: "jose",
          name: "Jose",
          email: "jose@example.com",
          role: "owner",
          joinedAt: "2027-01-01T10:00:00.000Z",
        },
        {
          userId: "laura",
          name: "Laura",
          email: "laura@example.com",
          role: "editor",
          joinedAt: "2027-01-02T10:00:00.000Z",
        },
      ],
    });
  });

  it("looks up all member profiles in a single call", async () => {
    const port = userProfiles();

    await listTripMembers(
      { userId: "jose", tripId: "trip-1" },
      { members: members([owner, laura]), profiles: port },
    );

    expect(port.getMany).toHaveBeenCalledTimes(1);
    expect(port.getMany).toHaveBeenCalledWith(["jose", "laura"]);
  });

  it("answers TRIP_NOT_FOUND for a user who is not a member", async () => {
    const result = await listTripMembers(
      { userId: "stranger", tripId: "trip-1" },
      { members: members([owner, laura]), profiles: userProfiles() },
    );

    expect(result).toEqual({ ok: false, error: { code: "TRIP_NOT_FOUND" } });
  });

  it("answers TRIP_NOT_FOUND for a missing trip", async () => {
    const result = await listTripMembers(
      { userId: "jose", tripId: "gone" },
      { members: members([]), profiles: userProfiles() },
    );

    expect(result).toEqual({ ok: false, error: { code: "TRIP_NOT_FOUND" } });
  });
});
