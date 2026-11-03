import { describe, expect, it } from "vitest";
import { cityIndex } from "@/modules/trips/data/city-index";

function search(query: string, options: Partial<Parameters<typeof cityIndex.search>[0]> = {}) {
  return cityIndex.search({ query, locale: "en", ...options });
}

describe("cityIndex.search", () => {
  it("finds a city by the start of its English name", () => {
    const [first] = search("lond");

    expect(first).toMatchObject({ code: "LON", name: "London" });
  });

  it("names the city in the request locale", () => {
    const [first] = search("lond", { locale: "es" });

    expect(first).toMatchObject({ code: "LON", name: "Londres" });
  });

  it("finds a city by its name in the other locale", () => {
    expect(search("londres").map((city) => city.code)).toContain("LON");
  });

  it("ignores accents and case in the query and the names", () => {
    expect(search("MALAGA").map((city) => city.name)).toContain("Málaga");
    expect(search("málaga").map((city) => city.name)).toContain("Málaga");
  });

  it("returns at most 8 options", () => {
    expect(search("sa").length).toBeLessThanOrEqual(8);
    expect(search("sa").length).toBeGreaterThan(0);
  });

  it("ranks the bigger city first among equal prefix matches", () => {
    const names = search("par").map((city) => city.name);

    expect(names[0]).toBe("Paris");
  });

  it("leaves out the excluded city", () => {
    const [madrid] = search("madr");
    expect(madrid?.name).toBe("Madrid");

    const rest = search("madr", { exclude: madrid?.cityId });

    expect(rest.map((city) => city.cityId)).not.toContain(madrid?.cityId);
  });

  it("gives every option an id, a code and a country name", () => {
    const [first] = search("lond");

    expect(first?.cityId).toBeTruthy();
    expect(first?.country).toBe("United Kingdom");
    expect(search("lond", { locale: "es" })[0]?.country).toBe("Reino Unido");
  });

  it("returns nothing for an unknown query", () => {
    expect(search("zzzzqqq")).toEqual([]);
  });
});

describe("cityIndex.search without a query", () => {
  it("lists popular cities, the region's first", () => {
    const options = search("", { region: "CO" });

    expect(options.length).toBeGreaterThan(0);
    expect(options.length).toBeLessThanOrEqual(8);
    expect(options[0]?.country).toBe("Colombia");
  });

  it("still lists popular cities when the region is unknown", () => {
    expect(search("").length).toBeGreaterThan(0);
  });

  it("leaves out the excluded city", () => {
    const [first] = search("");
    const rest = search("", { exclude: first?.cityId });

    expect(rest.map((city) => city.cityId)).not.toContain(first?.cityId);
  });
});

describe("cityIndex.localizeName", () => {
  it("returns the stored name in the locale for a known city", () => {
    const [london] = search("lond");
    const city = { cityId: london?.cityId ?? null, name: "London" };

    expect(cityIndex.localizeName(city, "es")).toBe("Londres");
    expect(cityIndex.localizeName(city, "en")).toBe("London");
  });

  it("keeps the typed name of a free text city", () => {
    expect(cityIndex.localizeName({ cityId: null, name: "Atlantis" }, "es")).toBe("Atlantis");
  });
});
