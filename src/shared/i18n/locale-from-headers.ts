import { type Locale, routing } from "@/shared/i18n/routing";

const LOCALE_COOKIE = "NEXT_LOCALE";

function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && (routing.locales as readonly string[]).includes(value);
}

function localeFromCookie(cookieHeader: string): Locale | undefined {
  for (const part of cookieHeader.split(";")) {
    const [name, value] = part.trim().split("=");
    if (name === LOCALE_COOKIE && isLocale(value)) {
      return value;
    }
  }
  return undefined;
}

function localeFromAcceptLanguage(header: string): Locale | undefined {
  const ranked = header
    .split(",")
    .map((entry) => {
      const [tag = "", ...params] = entry.trim().split(";");
      const q = params.find((param) => param.trim().startsWith("q="));
      return { language: tag.toLowerCase().split("-")[0], q: q ? Number(q.trim().slice(2)) : 1 };
    })
    .filter((entry) => entry.q > 0)
    .sort((a, b) => b.q - a.q);
  return ranked.map((entry) => entry.language).find(isLocale);
}

/**
 * Same order the next-intl middleware uses: the `NEXT_LOCALE` cookie
 * (set only when the user's locale differs from the browser's), then
 * `Accept-Language`, then the default locale. For server code that has
 * a request but no locale route segment, e.g. auth email callbacks.
 */
export function localeFromHeaders(headers: Headers | undefined): Locale {
  const cookie = headers?.get("cookie");
  const acceptLanguage = headers?.get("accept-language");
  return (
    (cookie ? localeFromCookie(cookie) : undefined) ??
    (acceptLanguage ? localeFromAcceptLanguage(acceptLanguage) : undefined) ??
    routing.defaultLocale
  );
}
