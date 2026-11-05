import { describe, expect, it, vi } from "vitest";
import type { Invite } from "@/modules/trips/domain/invite";
import type { Member } from "@/modules/trips/domain/membership";
import { getOrCreateInvite } from "@/modules/trips/service/get-or-create-invite";
import type {
  InvitesRepository,
  MembersRepository,
  TokenGenerator,
} from "@/modules/trips/service/ports";

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

function invitesStoring(stored: Invite | null) {
  const repository: InvitesRepository = {
    findForTrip: vi.fn(async () => stored),
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

describe("getOrCreateInvite", () => {
  it("creates a link that expires in 7 days when the trip has none", async () => {
    const invites = invitesStoring(null);

    const result = await getOrCreateInvite(command("jose"), {
      members: members(),
      invites,
      tokens,
    });

    expect(invites.insertIfAbsent).toHaveBeenCalledWith({
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

  it("returns the active link without creating another one", async () => {
    const active: Invite = {
      tripId: "trip-1",
      token: "active-token",
      createdAt: new Date("2026-12-30T10:00:00Z"),
      expiresAt: new Date(NOW.getTime() + 3 * DAY_MS),
    };
    const invites = invitesStoring(active);

    const result = await getOrCreateInvite(command("jose"), {
      members: members(),
      invites,
      tokens,
    });

    expect(invites.insertIfAbsent).not.toHaveBeenCalled();
    expect(invites.replace).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      ok: true,
      value: { url: "https://travel.test/join/active-token" },
    });
  });

  it("replaces a link past its expiry with a new one", async () => {
    const expired: Invite = {
      tripId: "trip-1",
      token: "old-token",
      createdAt: new Date(NOW.getTime() - 8 * DAY_MS),
      expiresAt: new Date(NOW.getTime() - 60_000),
    };
    const invites = invitesStoring(expired);

    const result = await getOrCreateInvite(command("jose"), {
      members: members(),
      invites,
      tokens,
    });

    expect(invites.replace).toHaveBeenCalledWith({
      tripId: "trip-1",
      token: "fresh-token",
      createdAt: NOW,
      expiresAt: new Date(NOW.getTime() + 7 * DAY_MS),
    });
    expect(result).toMatchObject({
      ok: true,
      value: { url: "https://travel.test/join/fresh-token" },
    });
  });

  it("answers TRIP_FORBIDDEN to an editor and stores nothing", async () => {
    const invites = invitesStoring(null);

    const result = await getOrCreateInvite(command("laura"), {
      members: members(),
      invites,
      tokens,
    });

    expect(result).toEqual({ ok: false, error: { code: "TRIP_FORBIDDEN" } });
    expect(invites.insertIfAbsent).not.toHaveBeenCalled();
    expect(invites.replace).not.toHaveBeenCalled();
  });

  it("answers TRIP_NOT_FOUND to a user who is not on the trip", async () => {
    const invites = invitesStoring(null);

    const result = await getOrCreateInvite(command("stranger"), {
      members: members(),
      invites,
      tokens,
    });

    expect(result).toEqual({ ok: false, error: { code: "TRIP_NOT_FOUND" } });
    expect(invites.insertIfAbsent).not.toHaveBeenCalled();
  });
});
