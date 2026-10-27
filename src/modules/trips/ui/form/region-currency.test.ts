import { describe, expect, it } from "vitest";
import { currencyForLanguage } from "@/modules/trips/ui/form/region-currency";

describe("currencyForLanguage", () => {
  it.each([
    ["es-CO", "COP"],
    ["en-US", "USD"],
    ["es-MX", "MXN"],
    ["pt-BR", "BRL"],
    ["en-GB", "GBP"],
  ])("maps %s to %s", (language, currency) => {
    expect(currencyForLanguage(language)).toBe(currency);
  });

  it.each([["en"], ["es"], [""], ["not a locale"], ["en-ZZ"]])(
    "falls back to USD for %j (no known region)",
    (language) => {
      expect(currencyForLanguage(language)).toBe("USD");
    },
  );
});
