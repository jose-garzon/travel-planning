import cities from "@/modules/trips/data/cities.json";
import type { CityNames } from "@/modules/trips/service/ports";
import type { Locale } from "@/shared/i18n/routing";

export type CityOption = { cityId: string; code: string; name: string; country: string };

/** One row of `cities.json`, in population order (see `scripts/build-cities.ts`). */
export type CityRecord = {
  id: string;
  code: string;
  country: string;
  names: Record<Locale, string>;
  popular?: true;
};

type SearchOptions = { locale: Locale; exclude?: string | null };
type PopularOptions = SearchOptions & { region?: string | null };

export type CityIndex = CityNames & {
  search(query: string, options: SearchOptions): CityOption[];
  /** Suggestions before typing: popular cities, the browser region's first. */
  popular(options: PopularOptions): CityOption[];
};

const MAX_RESULTS = 8;

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/** 0 exact code, 1 name prefix, 2 later word prefix; `null` no match. */
function rankOf(query: string, code: string, names: string[]): number | null {
  if (code.toLowerCase() === query) {
    return 0;
  }
  if (names.some((name) => name.startsWith(query))) {
    return 1;
  }
  if (names.some((name) => name.split(/[\s-]+/).some((word) => word.startsWith(query)))) {
    return 2;
  }

  return null;
}

/** In-memory index over `records`; it is built once per server process. */
export function createCityIndex(records: CityRecord[]): CityIndex {
  const entries = records.map((record, order) => ({
    record,
    order,
    normalized: [...new Set(Object.values(record.names).map(normalize))],
  }));
  const byId = new Map(records.map((record) => [record.id, record]));

  const toOption = (record: CityRecord, locale: Locale): CityOption => ({
    cityId: record.id,
    code: record.code,
    name: record.names[locale],
    country: record.country,
  });

  return {
    localizeName(city, locale) {
      const record = city.cityId === null ? undefined : byId.get(city.cityId);

      return record?.names[locale] ?? city.name;
    },

    search(text, { locale, exclude }) {
      const query = normalize(text);
      if (query === "") {
        return [];
      }

      return entries
        .filter(({ record }) => record.id !== exclude)
        .flatMap((entry) => {
          const rank = rankOf(query, entry.record.code, entry.normalized);

          return rank === null ? [] : [{ entry, rank }];
        })
        .sort(
          (a, b) =>
            a.rank - b.rank ||
            Number(b.entry.record.popular === true) - Number(a.entry.record.popular === true) ||
            a.entry.order - b.entry.order,
        )
        .slice(0, MAX_RESULTS)
        .map(({ entry }) => toOption(entry.record, locale));
    },

    popular({ locale, exclude, region }) {
      const regionCode = region?.toUpperCase();
      const popular = records.filter((record) => record.popular && record.id !== exclude);
      const home = popular.filter((record) => record.country === regionCode);
      const rest = popular.filter((record) => record.country !== regionCode);

      return [...home, ...rest].slice(0, MAX_RESULTS).map((record) => toOption(record, locale));
    },
  };
}

export const cityIndex: CityIndex = createCityIndex(cities as CityRecord[]);
