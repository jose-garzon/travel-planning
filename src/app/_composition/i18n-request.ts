import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "@/shared/i18n/routing";

// Each module owns its messages under its own namespace. Register them here;
// modules cannot import each other, so the app layer merges them.
async function loadMessages(locale: string) {
  const shared = (await import(`@/shared/i18n/messages/${locale}.json`)).default;
  return { ...shared };
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: await loadMessages(locale),
  };
});
