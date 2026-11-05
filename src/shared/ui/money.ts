/** Formats minor units (cents) of `currency` for `locale`. Every currency is shown with 2 decimals. */
export function formatMoney(minor: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(minor / 100);
}
