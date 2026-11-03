import cities from "@/modules/trips/data/cities.json";
import type { CityNames } from "@/modules/trips/service/ports";
import type { Locale } from "@/shared/i18n/routing";

export type CityOption = { cityId: string; code: string; name: string; country: string };

export type CitySearch = {
  query: string;
  locale: Locale;
  /** City id never offered (the leg's From). */
  exclude?: string;
  /** ISO 3166 region of the browser: its popular cities come first when the query is empty. */
  region?: string;
};

/** Row of `cities.json`, built by `scripts/build-cities.ts`; `es` is absent when equal to `en`. */
type CityRow = {
  id: string;
  code: string;
  cc: string;
  en: string;
  es?: string;
  pop: number;
  popular?: true;
};

type IndexedCity = { row: CityRow; names: Record<Locale, string>; keys: Record<Locale, string> };

const MAX_OPTIONS = 8;
const MIN_QUERY_LENGTH = 2;

/** Lowercase without accents: "Málaga" and "MALAGA" compare equal. */
function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

const indexed: IndexedCity[] = (cities as CityRow[]).map((row) => {
  const names = { en: row.en, es: row.es ?? row.en };
  return { row, names, keys: { en: normalize(names.en), es: normalize(names.es) } };
});
// Biggest cities first, so a stable sort by tier keeps size as the tie-break.
indexed.sort((a, b) => b.row.pop - a.row.pop);

const byId = new Map(indexed.map((city) => [city.row.id, city]));
const OTHER_LOCALE: Record<Locale, Locale> = { en: "es", es: "en" };
const regionNames = new Map<Locale, Intl.DisplayNames>();

function countryName(code: string, locale: Locale): string {
  let names = regionNames.get(locale);
  if (!names) {
    names = new Intl.DisplayNames([locale], { type: "region" });
    regionNames.set(locale, names);
  }
  return names.of(code) ?? code;
}

function toOption({ row, names }: IndexedCity, locale: Locale): CityOption {
  return {
    cityId: row.id,
    code: row.code,
    name: names[locale],
    country: countryName(row.cc, locale),
  };
}

/** Lower is better; `null` when the city does not match. */
function tierOf(city: IndexedCity, query: string, locale: Locale): number | null {
  const own = city.keys[locale];
  const other = city.keys[OTHER_LOCALE[locale]];
  if (own.startsWith(query)) {
    return 0;
  }
  if (other.startsWith(query) || city.row.code.toLowerCase() === query) {
    return 1;
  }
  if (own.split(/[\s-]+/).some((word) => word.startsWith(query))) {
    return 2;
  }
  return null;
}

function popularCities({ locale, exclude, region }: CitySearch): CityOption[] {
  const popular = indexed.filter((city) => city.row.popular && city.row.id !== exclude);
  const inRegion = popular.filter((city) => city.row.cc === region?.toUpperCase());
  const rest = popular.filter((city) => !inRegion.includes(city));

  return [...inRegion, ...rest].slice(0, MAX_OPTIONS).map((city) => toOption(city, locale));
}

function search(request: CitySearch): CityOption[] {
  const query = normalize(request.query);
  if (query.length < MIN_QUERY_LENGTH) {
    return popularCities(request);
  }

  return indexed
    .filter((city) => city.row.id !== request.exclude)
    .map((city) => ({ city, tier: tierOf(city, query, request.locale) }))
    .filter((match): match is { city: IndexedCity; tier: number } => match.tier !== null)
    .sort((a, b) => a.tier - b.tier)
    .slice(0, MAX_OPTIONS)
    .map((match) => toOption(match.city, request.locale));
}

/** Bundled city list (plan D-1): localized names and search, no network. */
export const cityIndex: CityNames & { search(request: CitySearch): CityOption[] } = {
  localizeName: (city, locale) => {
    const known = city.cityId === null ? undefined : byId.get(city.cityId);
    return known ? known.names[locale] : city.name;
  },
  search,
};
