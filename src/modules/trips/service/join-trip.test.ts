import { describe, expect, it } from "vitest";
import type { Invite } from "@/modules/trips/domain/invite";
import { joinTrip } from "@/modules/trips/service/join-trip";
import type {
  AddMemberRecord,
  InvitesRepository,
  MembersRepository,
} from "@/modules/trips/service/ports";

const now = new Date("2026-11-03T10:00:00Z");

const invite: Invite = {
  tripId: "trip-1",
  token: "token-1",
  createdAt: new Date("2026-11-01T10:00:00Z"),
  expiresAt: new Date("2026-11-08T10:00:00Z"),
};

/** A repository that finds `found` for any token (null: unknown, reset or deleted trip). */
function invites(found: Invite | null): InvitesRepository {
  return {
    findForTrip: async () => null,
    findByToken: async () => found,
    findPreviewByToken: async () => null,
    insertIfAbsent: async (stored) => stored,
    replace: async (stored) => stored,
  };
}

/** Members that answer `outcome` to `addIfRoom` and record what they were asked. */
function members(outcome: "added" | "full" | "already") {
  const added: AddMemberRecord[] = [];
  const repository: MembersRepository = {
    listForTrip: async () => [],
    addIfRoom: async (record) => {
      added.push(record);
      return outcome;
    },
    remove: async () => {},
  };

  return { repository, added };
}

describe("joinTrip", () => {
  it("adds the user as an editor and answers alreadyMember false", async () => {
    const { repository, added } = members("added");

    const result = await joinTrip(
      { userId: "laura", token: "token-1", now },
      { invites: invites(invite), members: repository },
    );

    expect(added).toEqual([{ tripId: "trip-1", userId: "laura", role: "editor", joinedAt: now }]);
    expect(result).toEqual({ ok: true, value: { tripId: "trip-1", alreadyMember: false } });
  });

  it("answers alreadyMember true for someone already on the trip", async () => {
    const { repository } = members("already");

    const result = await joinTrip(
      { userId: "laura", token: "token-1", now },
      { invites: invites(invite), members: repository },
    );

    expect(result).toEqual({ ok: true, value: { tripId: "trip-1", alreadyMember: true } });
  });

  it("answers TRIP_FULL when the trip has 20 members", async () => {
    const { repository } = members("full");

    const result = await joinTrip(
      { userId: "laura", token: "token-1", now },
      { invites: invites(invite), members: repository },
    );

    expect(result).toEqual({ ok: false, error: { code: "TRIP_FULL" } });
  });

  it("answers INVITE_EXPIRED for a link past its expiry without adding anyone", async () => {
    const { repository, added } = members("added");
    const afterExpiry = new Date(invite.expiresAt.getTime() + 1);

    const result = await joinTrip(
      { userId: "laura", token: "token-1", now: afterExpiry },
      { invites: invites(invite), members: repository },
    );

    expect(result).toEqual({ ok: false, error: { code: "INVITE_EXPIRED" } });
    expect(added).toEqual([]);
  });

  it("answers INVITE_EXPIRED for an unknown or reset token", async () => {
    const { repository, added } = members("added");

    const result = await joinTrip(
      { userId: "laura", token: "replaced-token", now },
      { invites: invites(null), members: repository },
    );

    expect(result).toEqual({ ok: false, error: { code: "INVITE_EXPIRED" } });
    expect(added).toEqual([]);
  });

  it("answers INVITE_EXPIRED when the trip was deleted", async () => {
    // Deleting the trip removes its link, so the token finds nothing.
    const { repository, added } = members("added");

    const result = await joinTrip(
      { userId: "laura", token: "token-1", now },
      { invites: invites(null), members: repository },
    );

    expect(result).toEqual({ ok: false, error: { code: "INVITE_EXPIRED" } });
    expect(added).toEqual([]);
  });
});
