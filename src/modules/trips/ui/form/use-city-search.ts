import { useEffect, useRef, useState } from "react";

export type CityOption = { cityId: string; code: string; name: string; country: string };

/** Region of the browser language ("es-CO" -> "CO", "es" -> "ES"), or undefined. */
function browserRegion(): string | undefined {
  try {
    return new Intl.Locale(navigator.language).maximize().region;
  } catch {
    return undefined;
  }
}

/**
 * Loads `/api/v1/cities` options. Only the newest request counts: a
 * new one (or `cancel`) aborts the previous and drops its answer.
 */
export function useCitySearch({ locale, exclude }: { locale: string; exclude: string | null }) {
  const [options, setOptions] = useState<CityOption[]>([]);
  const [isSettled, setIsSettled] = useState(false);
  const controller = useRef<AbortController>(undefined);
  const latest = useRef(0);

  useEffect(() => () => controller.current?.abort(), []);

  function cancel() {
    controller.current?.abort();
    latest.current += 1;
  }

  async function load(query: string) {
    cancel();
    const request = latest.current;
    const abort = new AbortController();
    controller.current = abort;
    setIsSettled(false);

    const params = new URLSearchParams({ q: query.trim(), locale });
    const region = browserRegion();
    if (region !== undefined) {
      params.set("region", region);
    }
    if (exclude !== null) {
      params.set("exclude", exclude);
    }

    let found: CityOption[] = [];
    try {
      const response = await fetch(`/api/v1/cities?${params}`, { signal: abort.signal });
      if (response.ok) {
        found = ((await response.json()) as { items: CityOption[] }).items;
      }
    } catch {
      // Offline or aborted: the typed text still works as a free-text city.
    }
    if (request === latest.current) {
      setOptions(found.filter((city) => city.cityId !== exclude));
      setIsSettled(true);
    }
  }

  return { options, isSettled, load, cancel, markPending: () => setIsSettled(false) };
}
