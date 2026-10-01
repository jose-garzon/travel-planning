import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { loadAuthMessages } from "@/modules/auth";
import { loadStyleguideMessages } from "@/modules/styleguide";
import { loadTripsMessages } from "@/modules/trips";
import type { Locale } from "@/shared/i18n/routing";
import { routing } from "@/shared/i18n/routing";

// Each module owns its messages under its own namespace. Register them here;
// modules cannot import each other, so the app layer merges them.
async function loadMessages(locale: Locale) {
  const shared = (await import(`@/shared/i18n/messages/${locale}.json`)).default;
  return {
    ...shared,
    styleguide: await loadStyleguideMessages(locale),
    auth: await loadAuthMessages(locale),
    trips: await loadTripsMessages(locale),
  };
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: await loadMessages(locale),
  };
});
