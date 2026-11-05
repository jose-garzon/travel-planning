import type { MembersRepository, UserProfiles } from "@/modules/trips/service/ports";
import type { MemberDto } from "@/modules/trips/service/schemas";
import type { Result } from "@/shared/kernel/result";
import { err, ok } from "@/shared/kernel/result";

export type ListTripMembersQuery = { userId: string; tripId: string };

export type ListTripMembersDeps = { members: MembersRepository; profiles: UserProfiles };

/**
 * The travelers of a trip, owner first then by join date (feature 009 plan
 * "Contracts"). A non-member gets `TRIP_NOT_FOUND`, as does a missing trip.
 */
export async function listTripMembers(
  { userId, tripId }: ListTripMembersQuery,
  { members, profiles }: ListTripMembersDeps,
): Promise<Result<MemberDto[], { code: "TRIP_NOT_FOUND" }>> {
  const roster = await members.listForTrip(tripId);
  // An empty roster is a missing trip; a roster without the caller is a stranger's trip.
  if (!roster.some((member) => member.userId === userId)) {
    return err({ code: "TRIP_NOT_FOUND" });
  }

  const people = await profiles.getMany(roster.map((member) => member.userId));
  const byId = new Map(people.map((person) => [person.id, person]));

  return ok(
    roster.flatMap((member) => {
      const person = byId.get(member.userId);
      if (person === undefined) {
        return [];
      }
      return [
        {
          userId: member.userId,
          name: person.name,
          email: person.email,
          role: member.role,
          joinedAt: member.joinedAt.toISOString(),
        },
      ];
    }),
  );
}
