import { describe, expect, it } from "vitest";
import {
  INVITE_TTL_DAYS,
  type Invite,
  inviteExpiresAt,
  isExpired,
} from "@/modules/trips/domain/invite";

const createdAt = new Date("2027-01-01T10:00:00Z");
const invite: Invite = {
  tripId: "trip-1",
  token: "token-1",
  createdAt,
  expiresAt: new Date("2027-01-08T10:00:00Z"),
};

describe("inviteExpiresAt", () => {
  it("expires the link INVITE_TTL_DAYS days after it was created", () => {
    const expected = new Date("2027-01-08T10:00:00Z");

    expect(INVITE_TTL_DAYS).toBe(7);
    expect(inviteExpiresAt(createdAt)).toEqual(expected);
  });
});

describe("isExpired", () => {
  it("is false before the expiry instant", () => {
    const now = new Date(invite.expiresAt.getTime() - 1);

    expect(isExpired({ invite, now })).toBe(false);
  });

  it("is true at the expiry instant", () => {
    expect(isExpired({ invite, now: invite.expiresAt })).toBe(true);
  });

  it("is true after the expiry instant", () => {
    const now = new Date(invite.expiresAt.getTime() + 60_000);

    expect(isExpired({ invite, now })).toBe(true);
  });
});
