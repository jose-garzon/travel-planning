import { describe, expect, it } from "vitest";
import { currentStop, groupByStop, orphanTransfers } from "./plan";

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

describe("currentStop", () => {
  it("finds the stop holding today; a travel day belongs to the arrival", () => {
    expect(currentStop(stops, "2026-11-05", "2026-11-11")).toBe(0);
    expect(currentStop(stops, "2026-11-07", "2026-11-11")).toBe(1);
  });

  it("runs the last stop to the trip's end, then nothing", () => {
    const open = [...stops.slice(0, 1), { city: "Santa Marta", from: "2026-11-07", to: null }];
    expect(currentStop(open, "2026-11-11", "2026-11-11")).toBe(1);
    expect(currentStop(open, "2026-11-12", "2026-11-11")).toBe(-1);
  });

  it("is -1 before the trip and for undated stops", () => {
    expect(currentStop(stops, "2026-10-01", "2026-11-11")).toBe(-1);
    expect(currentStop([{ city: "X", from: null, to: null }], "2026-11-05", null)).toBe(-1);
  });
});

describe("orphanTransfers", () => {
  it("keeps the transfers whose gap is not on the route any more", () => {
    const transfers = [{ gap: 0 }, { gap: 2 }, { gap: 3 }, { gap: 9 }];

    expect(orphanTransfers(transfers, [{ index: 0 }, { index: 1 }, { index: 2 }])).toEqual([
      { gap: 3 },
      { gap: 9 },
    ]);
  });
});
