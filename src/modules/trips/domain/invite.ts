const DAY_MS = 24 * 60 * 60 * 1000;

/** Invite links last this many days from the moment they are created or reset. */
export const INVITE_TTL_DAYS = 7;

/** The one active invite link of a trip (feature 009 plan "Data model"). */
export type Invite = {
  tripId: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
};

/** A link is expired from its `expiresAt` instant on. */
export function isExpired({ invite, now }: { invite: Invite; now: Date }): boolean {
  return now.getTime() >= invite.expiresAt.getTime();
}

/** The expiry of a link created at `now`. */
export function inviteExpiresAt(now: Date): Date {
  return new Date(now.getTime() + INVITE_TTL_DAYS * DAY_MS);
}
