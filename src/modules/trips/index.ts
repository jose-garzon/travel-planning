import "server-only";
import { randomBytes } from "node:crypto";
import { type CitySearch, cityIndex } from "@/modules/trips/data/city-index";
import { DrizzleInvitesRepository } from "@/modules/trips/data/drizzle-invites-repository";
import { DrizzleMembersRepository } from "@/modules/trips/data/drizzle-members-repository";
import { DrizzleTripsRepository } from "@/modules/trips/data/drizzle-trips-repository";
import type { CreateTripCommand } from "@/modules/trips/service/create-trip";
import { createTrip as createTripUseCase } from "@/modules/trips/service/create-trip";
import type { DeleteTripCommand } from "@/modules/trips/service/delete-trip";
import { deleteTrip as deleteTripUseCase } from "@/modules/trips/service/delete-trip";
import type { GetHomeTripsQuery } from "@/modules/trips/service/get-home-trips";
import { getHomeTrips as getHomeTripsUseCase } from "@/modules/trips/service/get-home-trips";
import type { GetInvitePreviewQuery } from "@/modules/trips/service/get-invite-preview";
import { getInvitePreview as getInvitePreviewUseCase } from "@/modules/trips/service/get-invite-preview";
import type { GetOrCreateInviteCommand } from "@/modules/trips/service/get-or-create-invite";
import { getOrCreateInvite as getOrCreateInviteUseCase } from "@/modules/trips/service/get-or-create-invite";
import type { GetTripQuery } from "@/modules/trips/service/get-trip";
import { getTrip as getTripUseCase } from "@/modules/trips/service/get-trip";
import type { GetTripAccessQuery } from "@/modules/trips/service/get-trip-access";
import { getTripAccess as getTripAccessUseCase } from "@/modules/trips/service/get-trip-access";
import type { JoinTripCommand } from "@/modules/trips/service/join-trip";
import { joinTrip as joinTripUseCase } from "@/modules/trips/service/join-trip";
import type { LeaveTripCommand } from "@/modules/trips/service/leave-trip";
import { leaveTrip as leaveTripUseCase } from "@/modules/trips/service/leave-trip";
import type { ListTripMembersQuery } from "@/modules/trips/service/list-trip-members";
import { listTripMembers as listTripMembersUseCase } from "@/modules/trips/service/list-trip-members";
import type { TokenGenerator, UserProfiles } from "@/modules/trips/service/ports";
import type { RemoveMemberCommand } from "@/modules/trips/service/remove-member";
import { removeMember as removeMemberUseCase } from "@/modules/trips/service/remove-member";
import type { ResetInviteCommand } from "@/modules/trips/service/reset-invite";
import { resetInvite as resetInviteUseCase } from "@/modules/trips/service/reset-invite";
import { toTripDto } from "@/modules/trips/service/schemas";
import type { UpdateTripCommand } from "@/modules/trips/service/update-trip";
import { updateTrip as updateTripUseCase } from "@/modules/trips/service/update-trip";
import type { Locale } from "@/shared/i18n/routing";

export type { RouteViolation } from "@/modules/trips/domain/route";
export type { TripsMessages } from "@/modules/trips/messages/load";
export { loadTripsMessages } from "@/modules/trips/messages/load";
export type { HomeTrips } from "@/modules/trips/service/get-home-trips";
export type { TripDto, TripInput } from "@/modules/trips/service/schemas";
export { tripInputSchema } from "@/modules/trips/service/schemas";
export type {
  UpdateTripCommand,
  UpdateTripError,
} from "@/modules/trips/service/update-trip";

const deps = { trips: new DrizzleTripsRepository(), cities: cityIndex };

/** Saves a trip owned by `userId`, or returns the route violations (plan "Contracts"). */
export function createTrip(command: CreateTripCommand) {
  return createTripUseCase(command, deps);
}

/** One trip for a member (`TRIP_NOT_FOUND` for a non-member). */
export function getTrip(query: GetTripQuery) {
  return getTripUseCase(query, deps);
}

/** Owner or editor edit with a version check (`TRIP_VERSION_CONFLICT` when stale). */
export function updateTrip(command: UpdateTripCommand) {
  return updateTripUseCase(command, deps);
}

/** Owner-only delete (D-5); members and legs go with the trip. */
export function deleteTrip(command: DeleteTripCommand) {
  return deleteTripUseCase(command, deps);
}

/** Next trip and the other trips for the home page. */
export function getHomeTrips(query: GetHomeTripsQuery) {
  return getHomeTripsUseCase(query, deps);
}

/** Every trip of `userId`, newest first as stored (cursor paging is not needed yet). */
export async function listMyTrips({ userId, locale }: { userId: string; locale: Locale }) {
  const trips = await deps.trips.listForUser(userId);

  return trips.map((trip) => toTripDto(trip, (city) => deps.cities.localizeName(city, locale)));
}

/** Up to 8 cities for the combobox; popular ones when the query is short. */
export function searchCities(request: CitySearch) {
  return deps.cities.search(request);
}

/** The members side of trips, with the profiles port injected by the app layer (feature 009 plan D-1). */
export function createMembersApi({ profiles }: { profiles: UserProfiles }) {
  const members = new DrizzleMembersRepository();
  const invites = new DrizzleInvitesRepository();
  // 32 random bytes, base64url: 43 characters (feature 009 plan "Data model").
  const tokens: TokenGenerator = { generate: () => randomBytes(32).toString("base64url") };
  const inviteDeps = { members, invites, tokens };

  return {
    listTripMembers: (query: ListTripMembersQuery) =>
      listTripMembersUseCase(query, { members, profiles }),
    getTripAccess: (query: GetTripAccessQuery) => getTripAccessUseCase(query, { members }),
    getOrCreateInvite: (command: GetOrCreateInviteCommand) =>
      getOrCreateInviteUseCase(command, inviteDeps),
    resetInvite: (command: ResetInviteCommand) => resetInviteUseCase(command, inviteDeps),
    getInvitePreview: (query: GetInvitePreviewQuery) =>
      getInvitePreviewUseCase(query, { invites, profiles }),
    joinTrip: (command: JoinTripCommand) => joinTripUseCase(command, { invites, members }),
    removeMember: (command: RemoveMemberCommand) => removeMemberUseCase(command, { members }),
    leaveTrip: (command: LeaveTripCommand) => leaveTripUseCase(command, { members }),
  };
}

/**
 * What other modules need about a trip (itinerary, budget, agent): currency,
 * dates, stops and member ids. Null when missing or `userId` is not a member.
 * Two queries.
 */
export async function getTripContext({
  userId,
  tripId,
  locale = "en",
}: {
  userId: string;
  tripId: string;
  locale?: Locale;
}) {
  const [trip, roster] = await Promise.all([
    deps.trips.findForMember(tripId, userId),
    new DrizzleMembersRepository().listForTrip(tripId),
  ]);
  if (trip === null) {
    return null;
  }
  const dto = toTripDto(trip, (city) => deps.cities.localizeName(city, locale));

  return {
    name: dto.name,
    currency: dto.currency,
    startDate: dto.startDate,
    endDate: dto.endDate,
    memberIds: roster.map((member) => member.userId),
    stops: dto.legs.map((leg) => ({ city: leg.to.name, from: leg.from.name, date: leg.date })),
    /** The route with each city's time zone: where transfers sit (feature 015). */
    route: {
      legs: dto.legs.map((leg) => ({
        from: {
          name: leg.from.name,
          code: leg.from.code,
          tz: deps.cities.timeZoneOf(leg.from.cityId),
        },
        to: { name: leg.to.name, code: leg.to.code, tz: deps.cities.timeZoneOf(leg.to.cityId) },
        date: leg.date,
      })),
    },
  };
}
