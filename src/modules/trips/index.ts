import "server-only";
import { InMemoryTripsReader } from "@/modules/trips/data/in-memory-trips-reader";
import { getHomeTripsSummary as getHomeTripsSummaryUseCase } from "@/modules/trips/service/get-home-trips-summary";
import type { Locale } from "@/shared/i18n/routing";

export type { HomeTripsSummary } from "@/modules/trips/service/get-home-trips-summary";

const tripsReader = new InMemoryTripsReader();

/** Home summary for the signed-in member's email (plan "Contracts"). */
export async function getHomeTripsSummary(email: string) {
  return getHomeTripsSummaryUseCase(email, tripsReader);
}

/** Loads `trips.*` messages for `locale` (single {en,es} pair; no split needed yet, ADR 0008). */
export async function loadTripsMessages(locale: Locale) {
  return (await import(`@/modules/trips/messages/${locale}.json`)).default;
}

// Type-only re-export (not the JSON itself) so `_composition/i18n-request.ts`
// can type the merged messages through this module's public API, per
// `app-uses-public-api` (dependency-cruiser).
export type TripsMessages = Awaited<ReturnType<typeof loadTripsMessages>>;
