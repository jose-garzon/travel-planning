import type {
  InvitesRepository,
  MembersRepository,
  TokenGenerator,
} from "@/modules/trips/service/ports";
import type { InviteDto } from "@/modules/trips/service/schemas";
import type { Result } from "@/shared/kernel/result";

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

/** The trip's active link, created when it has none (owner only). T02 implements it. */
export async function getOrCreateInvite(
  _command: GetOrCreateInviteCommand,
  _deps: InviteDeps,
): Promise<Result<InviteDto, { code: "TRIP_NOT_FOUND" | "TRIP_FORBIDDEN" }>> {
  throw new Error("not implemented: T02");
}
