import { describe, expect, it, vi } from "vitest";
import type { Invite } from "@/modules/trips/domain/invite";
import type { Member } from "@/modules/trips/domain/membership";
import type {
  InvitesRepository,
  MembersRepository,
  TokenGenerator,
} from "@/modules/trips/service/ports";
import { resetInvite } from "@/modules/trips/service/reset-invite";

const NOW = new Date("2027-01-01T10:00:00Z");
const DAY_MS = 24 * 60 * 60 * 1000;

const roster: Member[] = [
  { userId: "jose", role: "owner", joinedAt: new Date("2027-01-01T09:00:00Z") },
  { userId: "laura", role: "editor", joinedAt: new Date("2027-01-01T09:30:00Z") },
];

function members(found: Member[] = roster): MembersRepository {
  return {
    listForTrip: async () => found,
    addIfRoom: async () => "added",
    remove: async () => {},
  };
}

const current: Invite = {
  tripId: "trip-1",
  token: "old-token",
  createdAt: new Date("2026-12-30T10:00:00Z"),
  expiresAt: new Date(NOW.getTime() + 3 * DAY_MS),
};

function invites() {
  const repository: InvitesRepository = {
    findForTrip: async () => current,
    findByToken: async () => null,
    findPreviewByToken: async () => null,
    insertIfAbsent: vi.fn(async (invite: Invite) => invite),
    replace: vi.fn(async (invite: Invite) => invite),
  };
  return repository;
}

const tokens: TokenGenerator = { generate: () => "fresh-token" };

function command(userId: string) {
  return { userId, tripId: "trip-1", origin: "https://travel.test", now: NOW };
}

describe("resetInvite", () => {
  it("replaces the link with a new token and a new 7-day expiry", async () => {
    const store = invites();

    const result = await resetInvite(command("jose"), {
      members: members(),
      invites: store,
      tokens,
    });

    expect(store.replace).toHaveBeenCalledWith({
      tripId: "trip-1",
      token: "fresh-token",
      createdAt: NOW,
      expiresAt: new Date(NOW.getTime() + 7 * DAY_MS),
    });
    expect(result).toEqual({
      ok: true,
      value: {
        url: "https://travel.test/join/fresh-token",
        expiresAt: "2027-01-08T10:00:00.000Z",
      },
    });
  });

  it("answers TRIP_FORBIDDEN to an editor and leaves the link alone", async () => {
    const store = invites();

    const result = await resetInvite(command("laura"), {
      members: members(),
      invites: store,
      tokens,
    });

    expect(result).toEqual({ ok: false, error: { code: "TRIP_FORBIDDEN" } });
    expect(store.replace).not.toHaveBeenCalled();
  });

  it("answers TRIP_NOT_FOUND to a user who is not on the trip", async () => {
    const store = invites();

    const result = await resetInvite(command("stranger"), {
      members: members(),
      invites: store,
      tokens,
    });

    expect(result).toEqual({ ok: false, error: { code: "TRIP_NOT_FOUND" } });
    expect(store.replace).not.toHaveBeenCalled();
  });
});
