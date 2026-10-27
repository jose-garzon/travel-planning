// Small bundled region -> currency map (plan D-8). Regions not listed
// fall back to USD.
const CURRENCY_BY_REGION: Record<string, string> = {
  US: "USD",
  EC: "USD",
  SV: "USD",
  PR: "USD",
  CO: "COP",
  MX: "MXN",
  BR: "BRL",
  AR: "ARS",
  CL: "CLP",
  PE: "PEN",
  UY: "UYU",
  PY: "PYG",
  BO: "BOB",
  VE: "VES",
  CR: "CRC",
  PA: "PAB",
  GT: "GTQ",
  DO: "DOP",
  CU: "CUP",
  HN: "HNL",
  NI: "NIO",
  GB: "GBP",
  CH: "CHF",
  SE: "SEK",
  NO: "NOK",
  DK: "DKK",
  PL: "PLN",
  CZ: "CZK",
  ES: "EUR",
  FR: "EUR",
  DE: "EUR",
  IT: "EUR",
  PT: "EUR",
  NL: "EUR",
  BE: "EUR",
  IE: "EUR",
  AT: "EUR",
  FI: "EUR",
  GR: "EUR",
  CA: "CAD",
  AU: "AUD",
  NZ: "NZD",
  JP: "JPY",
  CN: "CNY",
  IN: "INR",
  KR: "KRW",
  SG: "SGD",
  HK: "HKD",
  TH: "THB",
  ID: "IDR",
  PH: "PHP",
  VN: "VND",
  TR: "TRY",
  AE: "AED",
  IL: "ILS",
  ZA: "ZAR",
  EG: "EGP",
  MA: "MAD",
  NG: "NGN",
  KE: "KES",
};

const FALLBACK_CURRENCY = "USD";

/** Currency for the region of a BCP 47 tag (`es-CO` -> COP); USD when there is none. */
export function currencyForLanguage(language: string): string {
  try {
    const region = new Intl.Locale(language).region;
    return (region && CURRENCY_BY_REGION[region]) || FALLBACK_CURRENCY;
  } catch {
    return FALLBACK_CURRENCY;
  }
}
