import { describe, expect, it, vi } from "vitest";
import { InMemoryTripsReader } from "@/modules/trips/data/in-memory-trips-reader";

// `server-only` throws outside a Next.js server bundle (its purpose);
// this plain Vitest run has no "react-server" condition, same as
// `src/modules/auth/index.integration.test.ts`. `vi.mock` is hoisted
// above this import.
vi.mock("server-only", () => ({}));

describe("InMemoryTripsReader", () => {
  it("returns two upcoming trips, Colombia trip then Peru trip, for an email containing +trips", async () => {
    const reader = new InMemoryTripsReader();

    const trips = await reader.listForEmail("member+trips@example.com");

    expect(trips.map((trip) => trip.name)).toEqual(["Colombia trip", "Peru trip"]);
  });

  // Locks the exact date used by the AC-14 i18n scenario ("Mar 3 - 10,
  // 2027" / "3 - 10 mar 2027"), which plan.md's D-4 fixture description
  // never pins down. 2027 is comfortably in the future of any run of
  // this feature (D-4 accepts this fixture as a temporary mock).
  it("gives Colombia trip a fixed date range for the AC-14 i18n scenario", async () => {
    const reader = new InMemoryTripsReader();

    const trips = await reader.listForEmail("member+trips@example.com");
    const colombiaTrip = trips.find((trip) => trip.name === "Colombia trip");

    expect(colombiaTrip).toEqual({
      name: "Colombia trip",
      startDate: "2027-03-03",
      endDate: "2027-03-10",
    });
  });

  it("returns one past trip for an email containing +pasttrips", async () => {
    const reader = new InMemoryTripsReader();
    const today = new Date().toISOString().slice(0, 10);

    const trips = await reader.listForEmail("member+pasttrips@example.com");

    expect(trips).toHaveLength(1);
    // `startDate`/`endDate` are `YYYY-MM-DD` strings (plan "Contracts"),
    // not numbers `toBeLessThan` can compare; ISO dates still order
    // correctly with the plain `<` string operator.
    expect((trips[0]?.startDate ?? "") < today).toBe(true);
    expect((trips[0]?.endDate ?? "") < today).toBe(true);
  });

  it("returns no trips for every other email", async () => {
    const reader = new InMemoryTripsReader();

    const trips = await reader.listForEmail("member@example.com");

    expect(trips).toEqual([]);
  });
});
