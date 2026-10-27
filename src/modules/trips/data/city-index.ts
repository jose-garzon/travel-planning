import type { CityNames } from "@/modules/trips/service/ports";

export type CityOption = { cityId: string; code: string; name: string; country: string };

/**
 * Stub until the bundled city list lands: the stored name is returned
 * as is and search finds nothing, so every city is free text.
 */
export const cityIndex: CityNames & { search(query: string): CityOption[] } = {
  localizeName: (city) => city.name,
  search: () => [],
};
