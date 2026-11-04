import type { Invite } from "@/modules/trips/domain/invite";
import { inviteExpiresAt, isExpired } from "@/modules/trips/domain/invite";
import { canManageMembers } from "@/modules/trips/domain/membership";
import type {
  InvitesRepository,
  MembersRepository,
  TokenGenerator,
} from "@/modules/trips/service/ports";
import type { InviteDto } from "@/modules/trips/service/schemas";
import type { Result } from "@/shared/kernel/result";
import { err, ok } from "@/shared/kernel/result";

export type GetOrCreateInviteCommand = {
  userId: string;
  tripId: string;
  /** Origin of the request, so `url` is absolute. */
  origin: string;
  now: Date;
};

export type InviteDeps = {
  members: MembersRepository;
  invites: InvitesRepository;
  tokens: TokenGenerator;
};

export type InviteError = { code: "TRIP_NOT_FOUND" | "TRIP_FORBIDDEN" };

/** Owner-only: `TRIP_NOT_FOUND` for a non-member, `TRIP_FORBIDDEN` for an editor. */
export async function requireOwner(
  { userId, tripId }: { userId: string; tripId: string },
  { members }: { members: MembersRepository },
): Promise<Result<undefined, InviteError>> {
  const roster = await members.listForTrip(tripId);
  const self = roster.find((member) => member.userId === userId);
  if (self === undefined) {
    return err({ code: "TRIP_NOT_FOUND" });
  }
  if (!canManageMembers(self.role)) {
    return err({ code: "TRIP_FORBIDDEN" });
  }

  return ok(undefined);
}

/** A link for `tripId` created at `now`, with a fresh token and the 7-day expiry. */
export function newInvite(tripId: string, now: Date, tokens: TokenGenerator): Invite {
  return { tripId, token: tokens.generate(), createdAt: now, expiresAt: inviteExpiresAt(now) };
}

/** The API shape of a link: absolute, with no locale prefix so the visitor's locale applies (EC-9). */
export function toInviteDto(invite: Invite, origin: string): InviteDto {
  return {
    url: `${origin}/join/${invite.token}`,
    expiresAt: invite.expiresAt.toISOString(),
  };
}

/**
 * The trip's active link, created when it has none or its link has
 * expired (owner only). A new link replaces the expired one.
 */
export async function getOrCreateInvite(
  { userId, tripId, origin, now }: GetOrCreateInviteCommand,
  deps: InviteDeps,
): Promise<Result<InviteDto, InviteError>> {
  const owner = await requireOwner({ userId, tripId }, deps);
  if (!owner.ok) {
    return owner;
  }

  const current = await deps.invites.findForTrip(tripId);
  if (current !== null && !isExpired({ invite: current, now })) {
    return ok(toInviteDto(current, origin));
  }

  const fresh = newInvite(tripId, now, deps.tokens);
  const stored =
    current === null ? await deps.invites.insertIfAbsent(fresh) : await deps.invites.replace(fresh);

  return ok(toInviteDto(stored, origin));
}
