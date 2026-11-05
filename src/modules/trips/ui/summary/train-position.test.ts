import { describe, expect, it } from "vitest";
import { trainPosition } from "./train-position";

// BOG → CTG on Jun 1, CTG → MDE on Jun 5, MDE → BOG on Jun 9; ends Jun 9.
const legs = ["2026-06-01", "2026-06-05", "2026-06-09"];

describe("trainPosition", () => {
  it("is null without a route", () => {
    expect(trainPosition([], null, "2026-06-01")).toBeNull();
  });

  it("waits at the origin before the trip", () => {
    expect(trainPosition(legs, "2026-06-09", "2026-05-20")).toEqual({
      station: 0,
      t: 0,
      overall: 0,
      state: "before",
    });
  });

  it("glides along the stay at a station", () => {
    const position = trainPosition(legs, "2026-06-09", "2026-06-03");
    expect(position).toMatchObject({ station: 1, t: 0.5, state: "during" });
    expect(position?.overall).toBeCloseTo(0.5);
  });

  it("moves to the next station on its leg's day", () => {
    expect(trainPosition(legs, "2026-06-09", "2026-06-05")).toMatchObject({ station: 2, t: 0 });
  });

  it("sits at the last station on the final day", () => {
    expect(trainPosition(legs, "2026-06-09", "2026-06-09")).toMatchObject({
      station: 3,
      overall: 1,
    });
  });

  it("is null once the trip is over", () => {
    expect(trainPosition(legs, "2026-06-09", "2026-06-10")).toBeNull();
  });
});
