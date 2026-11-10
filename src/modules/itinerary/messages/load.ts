import type { Locale } from "@/shared/i18n/routing";
import type activitiesEn from "./en/activities.json";

export type ItineraryMessages = { activities: typeof activitiesEn };

export async function loadItineraryMessages(locale: Locale): Promise<ItineraryMessages> {
  return { activities: (await import(`./${locale}/activities.json`)).default };
}
