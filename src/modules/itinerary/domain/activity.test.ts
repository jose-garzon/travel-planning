import { describe, expect, it } from "vitest";
import {
  type Activity,
  checkDate,
  costInTripCurrency,
  overlappingIds,
  sortActivities,
} from "@/modules/itinerary/domain/activity";

function activity(overrides: Partial<Activity>): Activity {
  return {
    id: "a",
    tripId: "t",
    date: "2027-01-10",
    title: "Museum",
    startTime: null,
    durationMinutes: null,
    costPerPerson: null,
    currency: null,
    rate: null,
    link: null,
    createdBy: "u1",
    participantIds: [],
    ...overrides,
  };
}

describe("overlappingIds", () => {
  it("flags timed activities that share minutes on the same day", () => {
    const a = activity({ id: "a", startTime: "10:00", durationMinutes: 90 });
    const b = activity({ id: "b", startTime: "11:00", durationMinutes: 30 });
    const c = activity({ id: "c", startTime: "11:30", durationMinutes: 30 });
    expect([...overlappingIds([a, b, c])].sort()).toEqual(["a", "b"]);
  });

  it("ignores untimed activities and other days", () => {
    const a = activity({ id: "a", startTime: "10:00", durationMinutes: 60 });
    const b = activity({ id: "b" });
    const c = activity({ id: "c", date: "2027-01-11", startTime: "10:00", durationMinutes: 60 });
    expect(overlappingIds([a, b, c]).size).toBe(0);
  });

  it("treats the same start time as an overlap", () => {
    const a = activity({ id: "a", startTime: "09:00" });
    const b = activity({ id: "b", startTime: "09:00" });
    expect(overlappingIds([a, b]).size).toBe(2);
  });
});

describe("sortActivities", () => {
  it("orders by day, untimed first, then time", () => {
    const sorted = sortActivities([
      activity({ id: "late", startTime: "18:00" }),
      activity({ id: "next", date: "2027-01-11" }),
      activity({ id: "untimed" }),
      activity({ id: "early", startTime: "08:00" }),
    ]);
    expect(sorted.map((a) => a.id)).toEqual(["untimed", "early", "late", "next"]);
  });
});

describe("costInTripCurrency", () => {
  it("converts with the stored rate", () => {
    expect(costInTripCurrency(activity({ costPerPerson: 1000, rate: "4200" }))).toBe(4_200_000);
    expect(costInTripCurrency(activity({}))).toBe(0);
  });
});

describe("checkDate", () => {
  it("rejects days outside the trip", () => {
    const range = { startDate: "2027-01-10", endDate: "2027-01-15" };
    expect(checkDate("2027-01-09", range)).toBe("OUTSIDE_TRIP");
    expect(checkDate("2027-01-16", range)).toBe("OUTSIDE_TRIP");
    expect(checkDate("2027-01-12", range)).toBeNull();
    expect(checkDate("2030-01-01", { startDate: null, endDate: null })).toBeNull();
  });
});
