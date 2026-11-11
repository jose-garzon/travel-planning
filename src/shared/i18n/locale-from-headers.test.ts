import { describe, expect, it } from "vitest";
import { localeFromHeaders } from "@/shared/i18n/locale-from-headers";

describe("localeFromHeaders", () => {
  it("prefers the NEXT_LOCALE cookie over Accept-Language", () => {
    const headers = new Headers({ cookie: "a=1; NEXT_LOCALE=es", "accept-language": "en-US" });
    expect(localeFromHeaders(headers)).toBe("es");
  });

  it("falls back to the best supported Accept-Language entry", () => {
    const headers = new Headers({ "accept-language": "fr;q=0.9, es-CO;q=0.8, en;q=0.1" });
    expect(localeFromHeaders(headers)).toBe("es");
  });

  it("ignores an unsupported cookie value", () => {
    const headers = new Headers({ cookie: "NEXT_LOCALE=de", "accept-language": "es" });
    expect(localeFromHeaders(headers)).toBe("es");
  });

  it("defaults to en without usable headers", () => {
    expect(localeFromHeaders(undefined)).toBe("en");
    expect(localeFromHeaders(new Headers({ "accept-language": "fr" }))).toBe("en");
  });
});
