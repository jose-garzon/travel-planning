import type { Invite } from "@/modules/trips/domain/invite";
import type { Member } from "@/modules/trips/domain/membership";
import type { Role, Trip } from "@/modules/trips/domain/trip";
import type { TripInput } from "@/modules/trips/service/schemas";
import type { Locale } from "@/shared/i18n/routing";

export type CreateTripRecord = {
  ownerId: string;
  input: TripInput;
  now: Date;
};

/** Persistence port. `create` saves the trip and its owner membership atomically. */
export type TripRepository = {
  create(record: CreateTripRecord): Promise<Trip>;
  /** Every trip the user is a member of, with legs, in at most 2 queries. */
  listForUser(userId: string): Promise<Trip[]>;
};

export type UpdateTripRecord = {
  tripId: string;
  input: TripInput;
  /** The write only lands when the stored version still equals this. */
  expectedVersion: number;
  now: Date;
};

/** Persistence port for reading one trip, editing and deleting it. */
export type TripEditRepository = {
  /** The trip with the member's role; null when missing or the user is not a member. */
  findForMember(tripId: string, userId: string): Promise<Trip | null>;
  /** Replaces name, currency and legs and bumps the version; null when the version is stale. */
  update(record: UpdateTripRecord): Promise<Trip | null>;
  /** Removes the trip with its members and legs. */
  remove(tripId: string): Promise<void>;
};

/** City names port: localizes a stored city for the request locale. */
export type CityNames = {
  localizeName(city: { cityId: string | null; name: string }, locale: Locale): string;
};

export type MemberProfile = { id: string; name: string; email: string };

/** Names and emails of members, from the auth module (feature 009 plan D-1). One query. */
export type UserProfiles = {
  getMany(userIds: string[]): Promise<MemberProfile[]>;
};

export type AddMemberRecord = {
  tripId: string;
  userId: string;
  role: Role;
  joinedAt: Date;
};

/** Members of trips. Member count and the cap live in the one table. */
export type MembersRepository = {
  /** Owner first, then by `joinedAt`, at most `MAX_MEMBERS`; `[]` when the trip is missing. One query. */
  listForTrip(tripId: string): Promise<Member[]>;
  /** One statement: inserts unless the trip is full (EC-3). `"already"` when the user is a member. */
  addIfRoom(record: AddMemberRecord): Promise<"added" | "full" | "already">;
  /** Removes the membership; a no-op when there is none. */
  remove(tripId: string, userId: string): Promise<void>;
};

/** The trip-side fields a visitor sees on the join page (feature 009 plan "Contracts"). */
export type InvitePreviewRecord = {
  tripId: string;
  tripName: string;
  ownerId: string;
  startDate: string | null;
  endDate: string | null;
  memberCount: number;
  expiresAt: Date;
};

/** The one active link of each trip (feature 009 plan "Data model", D-2). */
export type InvitesRepository = {
  findForTrip(tripId: string): Promise<Invite | null>;
  /** The link with this token, expired or not; null when unknown or the trip was deleted. */
  findByToken(token: string): Promise<Invite | null>;
  /** Trip name, dates and member count for the join page; one query. */
  findPreviewByToken(token: string): Promise<InvitePreviewRecord | null>;
  /** Stores `invite` unless the trip has a link already; returns the stored link. */
  insertIfAbsent(invite: Invite): Promise<Invite>;
  /** Replaces the trip's link in one statement; the old token stops matching. */
  replace(invite: Invite): Promise<Invite>;
};

/** Random invite tokens (32 bytes, base64url), injected so use cases stay pure (plan D-2). */
export type TokenGenerator = {
  generate(): string;
};
