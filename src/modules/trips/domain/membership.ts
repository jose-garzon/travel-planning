import type { Role } from "@/modules/trips/domain/trip";

/** A trip holds at most this many members (feature 009 plan "Contracts", EC-3). */
export const MAX_MEMBERS = 20;

/** A member of a trip, as stored (the name and email come from the user table). */
export type Member = {
  userId: string;
  role: Role;
  joinedAt: Date;
};

/** Only the owner adds, removes and invites members (plan D-5). */
export function canManageMembers(role: Role): boolean {
  return role === "owner";
}

/** True when a trip with `memberCount` members cannot take another one. */
export function isFull(memberCount: number): boolean {
  return memberCount >= MAX_MEMBERS;
}
