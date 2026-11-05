import { describe, expect, it } from "vitest";
import { groupByStop } from "./plan";

const stops = [
  { city: "Cartagena", from: "2026-11-03", to: "2026-11-07" },
  { city: "Santa Marta", from: "2026-11-07", to: "2026-11-11" },
];

describe("groupByStop", () => {
  it("puts an activity in the stop whose days hold it, travel day in the arrival", () => {
    const groups = groupByStop(
      stops,
      [{ date: "2026-11-04" }, { date: "2026-11-07" }, { date: "2026-11-20" }],
      [],
    );
    expect(groups.map((group) => group.activities.length)).toEqual([1, 1, 1]);
    expect(groups[1]?.activities[0]?.date).toBe("2026-11-07");
    expect(groups[2]?.stop).toBeNull();
  });

  it("puts costs by their stop, and unknown or missing stops in the whole trip", () => {
    const groups = groupByStop(stops, [], [{ stop: 1 }, { stop: null }, { stop: 9 }]);
    expect(groups.map((group) => group.costs.length)).toEqual([0, 1, 2]);
  });

  it("sends every activity to the whole trip while a leg is undated", () => {
    const groups = groupByStop(
      [stops[0] as (typeof stops)[0], { city: "X", from: null, to: null }],
      [{ date: "2026-11-04" }],
      [],
    );
    expect(groups[2]?.activities).toHaveLength(1);
  });
});
