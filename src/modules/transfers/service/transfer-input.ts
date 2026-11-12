import type { Gap, GapCity } from "@/modules/transfers/domain/gaps";

function plain(name: string): string {
  return name.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

function zoneOf(name: string, city: GapCity | null): string | null {
  return city?.tz != null && plain(name) === plain(city.name) ? city.tz : null;
}

/** Fills a missing zone from the gap's city when the transfer names it (agent proposals carry none). */
export function withKnownZones<
  T extends { from: string; to: string; departTz: string | null; arriveTz: string | null },
>(input: T, gap: Gap | undefined): T {
  return {
    ...input,
    departTz: input.departTz ?? zoneOf(input.from, gap?.from ?? null),
    arriveTz: input.arriveTz ?? zoneOf(input.to, gap?.to ?? null),
  };
}

/** A cost in another currency needs a rate above zero to count in the trip currency. */
export function lacksRate(
  input: { cost: number | null; currency: string | null; rate: string | null },
  tripCurrency: string,
): boolean {
  const foreign = input.cost !== null && (input.currency ?? tripCurrency) !== tripCurrency;
  return foreign && !(Number(input.rate) > 0);
}
