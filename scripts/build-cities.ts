/**
 * Builds `src/modules/trips/data/cities.json` (plan D-1).
 *
 * Joins OurAirports (public domain) airports with scheduled service to
 * GeoNames `cities1000` (CC BY 4.0) and its alternate names, keeping
 * English and Spanish names. Not part of the app bundle.
 *
 *   node --experimental-strip-types scripts/build-cities.ts
 *
 * Needs network and `unzip`. Downloads are cached in the OS temp dir.
 */
import { execFileSync } from "node:child_process";
import { createReadStream, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";

const AIRPORTS_URL = "https://davidmegginson.github.io/ourairports-data/airports.csv";
const GEONAMES_URL = "https://download.geonames.org/export/dump";
const OUTPUT = new URL("../src/modules/trips/data/cities.json", import.meta.url);

/** Metro codes for cities served by several airports, keyed `COUNTRY:asciiname`. */
const METRO_CODES: Record<string, string> = {
  "GB:London": "LON",
  "FR:Paris": "PAR",
  "US:New York City": "NYC",
  "IT:Rome": "ROM",
  "IT:Milan": "MIL",
  "AR:Buenos Aires": "BUE",
  "BR:Sao Paulo": "SAO",
  "BR:Rio de Janeiro": "RIO",
  "JP:Tokyo": "TYO",
  "US:Washington": "WAS",
  "RU:Moscow": "MOW",
  "SE:Stockholm": "STO",
  "CA:Toronto": "YTO",
  "CA:Montreal": "YMQ",
  "KR:Seoul": "SEL",
  "ID:Jakarta": "JKT",
};

const POPULAR_GLOBAL = 60;
const POPULAR_PER_COUNTRY = 4;

type City = {
  id: string;
  code: string;
  country: string;
  names: { en: string; es: string };
  popular?: true;
};

const cacheDir = join(tmpdir(), "travel-planning-cities");
mkdirSync(cacheDir, { recursive: true });

function download(url: string, file: string): string {
  const path = join(cacheDir, file);
  if (!existsSync(path)) {
    process.stdout.write(`downloading ${url}\n`);
    execFileSync("curl", ["-fsSL", "-o", path, url], { stdio: "inherit" });
  }
  return path;
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

async function* zipLines(zip: string, entry: string): AsyncGenerator<string> {
  const { spawn } = await import("node:child_process");
  const child = spawn("unzip", ["-p", zip, entry]);
  for await (const line of createInterface({ input: child.stdout })) {
    yield line;
  }
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

type Airport = { iata: string; type: string; country: string; municipality: string };

async function readAirports(path: string): Promise<Airport[]> {
  const airports: Airport[] = [];
  let header: string[] | null = null;
  for await (const line of createInterface({ input: createReadStream(path) })) {
    const fields = parseCsvLine(line);
    if (header === null) {
      header = fields;
      continue;
    }
    const row = Object.fromEntries(header.map((name, index) => [name, fields[index] ?? ""]));
    const usable = row.type === "large_airport" || row.type === "medium_airport";
    if (usable && row.scheduled_service === "yes" && row.iata_code && row.municipality) {
      airports.push({
        iata: row.iata_code,
        type: row.type ?? "",
        country: row.iso_country ?? "",
        municipality: row.municipality,
      });
    }
  }
  return airports;
}

type GeoCity = { id: string; name: string; ascii: string; country: string; population: number };

async function readGeoCities(zip: string): Promise<Map<string, GeoCity[]>> {
  // Key: `COUNTRY:normalized name` for the name, ascii name and alternates.
  const byKey = new Map<string, GeoCity[]>();
  for await (const line of zipLines(zip, "cities1000.txt")) {
    const f = line.split("\t");
    const city: GeoCity = {
      id: f[0] ?? "",
      name: f[1] ?? "",
      ascii: f[2] ?? "",
      country: f[8] ?? "",
      population: Number(f[14] ?? 0),
    };
    const names = new Set([city.name, city.ascii, ...(f[3] ?? "").split(",")].map(normalize));
    for (const name of names) {
      if (name === "") {
        continue;
      }
      const key = `${city.country}:${name}`;
      byKey.set(key, [...(byKey.get(key) ?? []), city]);
    }
  }
  return byKey;
}

async function readSpanishNames(zip: string, ids: Set<string>): Promise<Map<string, string>> {
  const best = new Map<string, { name: string; rank: number }>();
  for await (const line of zipLines(zip, "alternateNamesV2.txt")) {
    const f = line.split("\t");
    const id = f[1] ?? "";
    if (f[2] !== "es" || !ids.has(id) || f[6] === "1" || f[7] === "1") {
      continue;
    }
    const rank = (f[4] === "1" ? 2 : 0) + (f[5] === "1" ? 0 : 1);
    const current = best.get(id);
    if (current === undefined || rank > current.rank) {
      best.set(id, { name: f[3] ?? "", rank });
    }
  }
  return new Map([...best].map(([id, value]) => [id, value.name]));
}

async function main() {
  const airports = await readAirports(download(AIRPORTS_URL, "airports.csv"));
  const geo = await readGeoCities(download(`${GEONAMES_URL}/cities1000.zip`, "cities1000.zip"));

  const matched = new Map<string, { city: GeoCity; airport: Airport }>();
  let unmatched = 0;
  for (const airport of airports) {
    // "Paris (Roissy-en-France)" and "Tokyo, Narita" name the city first.
    const names = [airport.municipality, airport.municipality.split(/[(,]/)[0] ?? ""];
    const candidates = names
      .map((name) => geo.get(`${airport.country}:${normalize(name)}`))
      .find((found) => found !== undefined);
    const city = candidates?.reduce((a, b) => (b.population > a.population ? b : a));
    if (city === undefined) {
      unmatched++;
      continue;
    }
    const current = matched.get(city.id);
    const better =
      current === undefined ||
      (airport.type === "large_airport" && current.airport.type !== "large_airport");
    if (better) {
      matched.set(city.id, { city, airport });
    }
  }
  process.stdout.write(`${matched.size} cities, ${unmatched} airports unmatched\n`);

  const spanish = await readSpanishNames(
    download(`${GEONAMES_URL}/alternateNamesV2.zip`, "alternateNamesV2.zip"),
    new Set(matched.keys()),
  );

  const cities: City[] = [...matched.values()]
    .sort((a, b) => b.city.population - a.city.population)
    .map(({ city, airport }) => ({
      id: city.id,
      code: METRO_CODES[`${city.country}:${city.ascii}`] ?? airport.iata,
      country: city.country,
      names: { en: city.name, es: spanish.get(city.id) ?? city.name },
    }));

  const perCountry = new Map<string, number>();
  cities.forEach((city, index) => {
    const count = perCountry.get(city.country) ?? 0;
    perCountry.set(city.country, count + 1);
    if (index < POPULAR_GLOBAL || count < POPULAR_PER_COUNTRY) {
      city.popular = true;
    }
  });

  writeFileSync(OUTPUT, `${JSON.stringify(cities)}\n`);
  process.stdout.write(`wrote ${cities.length} cities\n`);
}

await main();
