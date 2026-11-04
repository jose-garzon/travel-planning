import { describe, expect, it } from "vitest";
import { getInvitePreview } from "@/modules/trips/service/get-invite-preview";
import type {
  InvitePreviewRecord,
  InvitesRepository,
  UserProfiles,
} from "@/modules/trips/service/ports";

const now = new Date("2026-11-03T10:00:00Z");

const record: InvitePreviewRecord = {
  tripId: "trip-1",
  tripName: "Europe",
  ownerId: "jose",
  startDate: "2026-11-20",
  endDate: "2026-12-03",
  memberCount: 1,
  expiresAt: new Date("2026-11-10T10:00:00Z"),
};

/** A repository that finds `found` for any token (null: unknown, reset or deleted trip). */
function invites(found: InvitePreviewRecord | null): InvitesRepository {
  return {
    findForTrip: async () => null,
    findByToken: async () => null,
    findPreviewByToken: async () => found,
    insertIfAbsent: async (invite) => invite,
    replace: async (invite) => invite,
  };
}

const profiles: UserProfiles = {
  getMany: async () => [{ id: "jose", name: "Jose", email: "jose@example.com" }],
};

describe("getInvitePreview", () => {
  it("answers the trip and the owner's name for a live link", async () => {
    const result = await getInvitePreview(
      { token: "token-1", now },
      { invites: invites(record), profiles },
    );

    expect(result).toEqual({
      ok: true,
      value: {
        tripId: "trip-1",
        tripName: "Europe",
        ownerName: "Jose",
        startDate: "2026-11-20",
        endDate: "2026-12-03",
        memberCount: 1,
      },
    });
  });

  it("answers INVITE_EXPIRED for a link past its expiry", async () => {
    const afterExpiry = new Date(record.expiresAt.getTime() + 1);

    const result = await getInvitePreview(
      { token: "token-1", now: afterExpiry },
      { invites: invites(record), profiles },
    );

    // The owner's name rides along so the expired page can say whom to ask (D-8).
    expect(result).toEqual({
      ok: false,
      error: { code: "INVITE_EXPIRED", ownerName: "Jose" },
    });
  });

  it("answers INVITE_EXPIRED for an unknown or reset token", async () => {
    const result = await getInvitePreview(
      { token: "replaced-token", now },
      { invites: invites(null), profiles },
    );

    expect(result).toEqual({ ok: false, error: { code: "INVITE_EXPIRED" } });
  });

  it("answers INVITE_EXPIRED when the trip was deleted", async () => {
    // The repository joins the link to its trip, so a deleted trip finds nothing.
    const result = await getInvitePreview(
      { token: "token-1", now },
      { invites: invites(null), profiles },
    );

    expect(result).toEqual({ ok: false, error: { code: "INVITE_EXPIRED" } });
  });
});
