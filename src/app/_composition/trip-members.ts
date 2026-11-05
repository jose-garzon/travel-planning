import "server-only";
import { getUserProfiles } from "@/modules/auth";
import { createMembersApi } from "@/modules/trips";

/** The members API, wired to the auth module's profile lookup (feature 009 plan D-1). */
export const tripMembers = createMembersApi({ profiles: { getMany: getUserProfiles } });
