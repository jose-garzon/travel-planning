/**
 * Formats minor units (cents) of `currency` for `locale`. Whole amounts drop
 * their decimals ("COP 0", "$412"); others keep two ("$12.50").
 */
export function formatMoney(minor: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    trailingZeroDisplay: "stripIfInteger",
  }).format(minor / 100);
}
