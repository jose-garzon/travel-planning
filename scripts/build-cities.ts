/**
 * Builds `src/modules/trips/data/cities.json` (plan D-1). Not part of
 * the app bundle; run it by hand when the city list should be refreshed:
 *
 *   node --experimental-strip-types scripts/build-cities.ts [workDir]
 *
 * Sources (downloaded into `workDir`, default the OS temp dir):
 * - OurAirports `airports.csv` (public domain): airports with scheduled
 *   service and an IATA code.
 * - GeoNames `cities15000.zip` and `alternateNamesV2.zip` (CC BY 4.0):
 *   cities over 15000 people and their English / Spanish names.
 *
 * A city is kept when an airport sits within RADIUS_KM of it (the most
 * populated city wins). Its code is the IATA metropolitan code when it
 * has one (LON, PAR, NYC), else the code of its main airport.
 */
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";

const OURAIRPORTS = "https://davidmegginson.github.io/ourairports-data/airports.csv";
const GEONAMES = "https://download.geonames.org/export/dump";
const RADIUS_KM = 60;
const POPULAR_PER_COUNTRY = 3;
const POPULAR_WORLD = 40;
const OUTPUT = join(import.meta.dirname, "../src/modules/trips/data/cities.json");

/** IATA metropolitan area code -> airports that belong to it. */
const METRO: Record<string, string[]> = {
  LON: ["LHR", "LGW", "STN", "LTN", "LCY", "SEN"],
  PAR: ["CDG", "ORY", "BVA"],
  NYC: ["JFK", "LGA", "EWR"],
  WAS: ["IAD", "DCA", "BWI"],
  CHI: ["ORD", "MDW"],
  MIL: ["MXP", "LIN", "BGY"],
  ROM: ["FCO", "CIA"],
  TYO: ["HND", "NRT"],
  OSA: ["ITM", "KIX"],
  SAO: ["GRU", "CGH", "VCP"],
  RIO: ["GIG", "SDU"],
  BUE: ["EZE", "AEP"],
  MOW: ["SVO", "DME", "VKO"],
  STO: ["ARN", "BMA"],
  BJS: ["PEK", "PKX"],
  SEL: ["ICN", "GMP"],
  JKT: ["CGK", "HLP"],
  YTO: ["YYZ", "YTZ"],
};
const METRO_OF = new Map(
  Object.entries(METRO).flatMap(([metro, airports]) => airports.map((iata) => [iata, metro])),
);

type Airport = { iata: string; type: string; lat: number; lon: number; country: string };
type GeoCity = { id: string; name: string; lat: number; lon: number; country: string; pop: number };

function download(url: string, file: string) {
  if (!existsSync(file)) {
    process.stdout.write(`downloading ${url}\n`);
    execFileSync("curl", ["-fsSL", "-o", file, url], { stdio: "inherit" });
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

async function readLines(command: string, args: string[], onLine: (line: string) => void) {
  const child = spawn(command, args, { stdio: ["ignore", "pipe", "inherit"] });
  for await (const line of createInterface({ input: child.stdout })) {
    onLine(line);
  }
}

function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

type Alt = { name: string; score: number };

/** Preferred names win; short forms lose. Columns of alternateNamesV2: 4 isPreferred, 5 isShort. */
function nameScore(columns: string[]): number {
  return (columns[4] === "1" ? 2 : 0) + (columns[5] === "1" ? -1 : 0);
}

function keepBetterName(
  names: Map<string, { en?: Alt; es?: Alt }>,
  cityId: string,
  lang: "en" | "es",
  candidate: Alt,
) {
  const entry = names.get(cityId) ?? {};
  if (!entry[lang] || candidate.score > (entry[lang]?.score ?? 0)) {
    entry[lang] = candidate;
  }
  names.set(cityId, entry);
}

async function main() {
  const workDir = process.argv[2] ?? join(tmpdir(), "build-cities");
  mkdirSync(workDir, { recursive: true });
  const airportsFile = join(workDir, "airports.csv");
  const citiesZip = join(workDir, "cities15000.zip");
  const namesZip = join(workDir, "alternateNamesV2.zip");
  download(OURAIRPORTS, airportsFile);
  download(`${GEONAMES}/cities15000.zip`, citiesZip);
  download(`${GEONAMES}/alternateNamesV2.zip`, namesZip);

  // Airports with scheduled service and an IATA code.
  const airports: Airport[] = [];
  let header: string[] = [];
  await readLines("cat", [airportsFile], (line) => {
    if (header.length === 0) {
      header = parseCsvLine(line);
      return;
    }
    const row = parseCsvLine(line);
    const get = (column: string) => row[header.indexOf(column)] ?? "";
    const type = get("type");
    if (
      get("iata_code") !== "" &&
      get("scheduled_service") === "yes" &&
      (type === "large_airport" || type === "medium_airport")
    ) {
      airports.push({
        iata: get("iata_code"),
        type,
        lat: Number(get("latitude_deg")),
        lon: Number(get("longitude_deg")),
        country: get("iso_country"),
      });
    }
  });

  const geoCities: GeoCity[] = [];
  await readLines("unzip", ["-p", citiesZip, "cities15000.txt"], (line) => {
    const c = line.split("\t");
    geoCities.push({
      id: c[0] ?? "",
      name: c[1] ?? "",
      lat: Number(c[4]),
      lon: Number(c[5]),
      country: c[8] ?? "",
      pop: Number(c[14]),
    });
  });

  // Join: each airport belongs to the most populated city within reach.
  const byCity = new Map<string, Airport[]>();
  for (const airport of airports) {
    const near = geoCities
      .filter((city) => city.country === airport.country)
      .filter((city) => haversineKm(city, airport) <= RADIUS_KM)
      .sort((a, b) => b.pop - a.pop)[0];
    if (near) {
      byCity.set(near.id, [...(byCity.get(near.id) ?? []), airport]);
    }
  }
  const kept = geoCities.filter((city) => byCity.has(city.id));
  const wanted = new Set(kept.map((city) => city.id));

  // English and Spanish names: preferred, not colloquial / historic.
  const names = new Map<string, { en?: Alt; es?: Alt }>();
  await readLines("unzip", ["-p", namesZip, "alternateNamesV2.txt"], (line) => {
    const c = line.split("\t");
    const lang = c[2];
    if (
      (lang === "en" || lang === "es") &&
      wanted.has(c[1] ?? "") &&
      c[6] !== "1" &&
      c[7] !== "1"
    ) {
      keepBetterName(names, c[1] ?? "", lang, { name: c[3] ?? "", score: nameScore(c) });
    }
  });

  kept.sort((a, b) => b.pop - a.pop);
  const perCountry = new Map<string, number>();
  const cities = kept.map((city, rank) => {
    const cityAirports = byCity.get(city.id) ?? [];
    const metro = cityAirports.map((a) => METRO_OF.get(a.iata)).find(Boolean);
    const main = [...cityAirports].sort(
      (a, b) => Number(b.type === "large_airport") - Number(a.type === "large_airport"),
    )[0];
    const seen = perCountry.get(city.country) ?? 0;
    perCountry.set(city.country, seen + 1);
    const en = names.get(city.id)?.en?.name ?? city.name;
    const es = names.get(city.id)?.es?.name ?? en;
    return {
      id: `g${city.id}`,
      code: metro ?? main?.iata ?? "",
      cc: city.country,
      en,
      ...(es === en ? {} : { es }),
      pop: city.pop,
      ...(seen < POPULAR_PER_COUNTRY || rank < POPULAR_WORLD ? { popular: true } : {}),
    };
  });

  writeFileSync(OUTPUT, `${JSON.stringify(cities)}\n`);
  process.stdout.write(`wrote ${cities.length} cities to ${OUTPUT}\n`);
}

await main();
