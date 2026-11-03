import { describe, expect, it } from "vitest";
import { cityIndex, createCityIndex } from "@/modules/trips/data/city-index";

const index = createCityIndex([
  { id: "1", code: "LON", country: "GB", names: { en: "London", es: "Londres" }, popular: true },
  { id: "2", code: "YXU", country: "CA", names: { en: "London", es: "London" } },
  { id: "3", code: "MAD", country: "ES", names: { en: "Madrid", es: "Madrid" }, popular: true },
  { id: "4", code: "BOG", country: "CO", names: { en: "Bogotá", es: "Bogotá" }, popular: true },
  { id: "5", code: "MDE", country: "CO", names: { en: "Medellín", es: "Medellín" }, popular: true },
  { id: "6", code: "SDQ", country: "DO", names: { en: "Santo Domingo", es: "Santo Domingo" } },
  { id: "7", code: "ROM", country: "IT", names: { en: "Rome", es: "Roma" }, popular: true },
]);

describe("city index search", () => {
  it("matches a prefix of the name", () => {
    const names = index.search("lond", { locale: "en" }).map((city) => city.code);

    expect(names).toEqual(["LON", "YXU"]);
  });

  it("matches without accents or case", () => {
    expect(index.search("BOGOTA", { locale: "en" })[0]?.code).toBe("BOG");
    expect(index.search("medellin", { locale: "en" })[0]?.code).toBe("MDE");
  });

  it("finds a city by its name in either language and answers in the asked one", () => {
    expect(index.search("londres", { locale: "en" })[0]).toMatchObject({
      cityId: "1",
      name: "London",
    });
    expect(index.search("lond", { locale: "es" })[0]).toMatchObject({
      cityId: "1",
      name: "Londres",
      country: "GB",
    });
  });

  it("ranks the exact code, then a name prefix, then a later word prefix", () => {
    const codes = index.search("sdq", { locale: "en" }).map((city) => city.code);
    const words = index.search("dom", { locale: "en" }).map((city) => city.code);

    expect(codes).toEqual(["SDQ"]);
    expect(words).toEqual(["SDQ"]);
    expect(index.search("ro", { locale: "en" }).map((city) => city.code)).toEqual(["ROM"]);
  });

  it("puts popular cities first among equal matches", () => {
    const flipped = createCityIndex([
      { id: "a", code: "AAA", country: "XX", names: { en: "Lima", es: "Lima" } },
      { id: "b", code: "BBB", country: "XX", names: { en: "Lisboa", es: "Lisboa" }, popular: true },
    ]);

    expect(flipped.search("li", { locale: "en" }).map((city) => city.code)).toEqual(["BBB", "AAA"]);
  });

  it("returns at most 8 cities", () => {
    const many = createCityIndex(
      Array.from({ length: 20 }, (_, n) => ({
        id: String(n),
        code: `A${String(n).padStart(2, "0")}`,
        country: "XX",
        names: { en: `Alpha ${n}`, es: `Alfa ${n}` },
      })),
    );

    expect(many.search("alp", { locale: "en" })).toHaveLength(8);
  });

  it("leaves out the excluded city", () => {
    const codes = index.search("mad", { locale: "en", exclude: "3" }).map((city) => city.code);

    expect(codes).not.toContain("MAD");
  });

  it("finds nothing for text that matches no city", () => {
    expect(index.search("zzzz", { locale: "en" })).toEqual([]);
  });
});

describe("city index popular", () => {
  it("lists the popular cities of the region first", () => {
    const codes = index.popular({ locale: "en", region: "CO" }).map((city) => city.code);

    expect(codes.slice(0, 2)).toEqual(["BOG", "MDE"]);
    expect(codes).not.toContain("SDQ");
  });

  it("lists popular cities without a region and leaves out the excluded one", () => {
    const codes = index.popular({ locale: "en", exclude: "3" }).map((city) => city.code);

    expect(codes.length).toBeGreaterThan(0);
    expect(codes).not.toContain("MAD");
  });
});

describe("localizeName", () => {
  it("names a known city in the locale", () => {
    expect(index.localizeName({ cityId: "1", name: "stored" }, "es")).toBe("Londres");
    expect(index.localizeName({ cityId: "1", name: "stored" }, "en")).toBe("London");
  });

  it("keeps the stored name for free text and unknown ids", () => {
    expect(index.localizeName({ cityId: null, name: "Bogotá" }, "es")).toBe("Bogotá");
    expect(index.localizeName({ cityId: "nope", name: "Somewhere" }, "en")).toBe("Somewhere");
  });
});

describe("bundled cities", () => {
  it("serves London in both languages", () => {
    expect(cityIndex.search("lond", { locale: "es" })[0]).toMatchObject({
      code: "LON",
      name: "Londres",
    });
  });

  it("answers within the 50 ms budget", () => {
    const start = performance.now();
    for (let n = 0; n < 20; n++) {
      cityIndex.search("san", { locale: "en" });
    }

    expect((performance.now() - start) / 20).toBeLessThan(50);
  });
});
