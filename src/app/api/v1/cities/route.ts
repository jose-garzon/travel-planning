import { searchCities } from "@/modules/trips";
import type { Locale } from "@/shared/i18n/routing";

/** `locale` query param matched to `en`/`es`; `en` otherwise. */
function localeOf(value: string | null): Locale {
  return value === "es" ? "es" : "en";
}

/**
 * Public city lookup (plan "Contracts"): `?q&locale`, max 8. Without
 * `q` it lists popular cities, the `region` ones first. `exclude` is a
 * city id left out of the answer.
 */
export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const items = searchCities({
    query: searchParams.get("q") ?? "",
    locale: localeOf(searchParams.get("locale")),
    region: searchParams.get("region"),
    exclude: searchParams.get("exclude"),
  });

  return Response.json({ items });
}
