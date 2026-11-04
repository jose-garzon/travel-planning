import type { MembersRepository } from "@/modules/trips/service/ports";

export type TripAccess = "member" | "not-member" | "missing";

export type GetTripAccessQuery = { userId: string; tripId: string };

/** Tells a member, a non-member and a missing trip apart (feature 009 plan D-4). */
export async function getTripAccess(
  { userId, tripId }: GetTripAccessQuery,
  { members }: { members: MembersRepository },
): Promise<TripAccess> {
  const roster = await members.listForTrip(tripId);
  if (roster.length === 0) {
    return "missing";
  }

  return roster.some((member) => member.userId === userId) ? "member" : "not-member";
}
