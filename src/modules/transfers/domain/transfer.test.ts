import { describe, expect, it } from "vitest";
import type { Gap } from "@/modules/transfers/domain/gaps";
import {
  costInTripCurrency,
  dayOffset,
  durationMinutes,
  isPast,
  outsideWindow,
  routeChanged,
  sortTransfers,
  type Transfer,
} from "@/modules/transfers/domain/transfer";

const BOGOTA = "America/Bogota";

function transfer(overrides: Partial<Transfer> = {}): Transfer {
  return {
    id: "t1",
    tripId: "trip-1",
    gap: 0,
    mode: "flight",
    from: "Bogotá",
    to: "Cartagena",
    departDate: "2027-03-15",
    departTime: null,
    departTz: null,
    arriveDate: null,
    arriveTime: null,
    arriveTz: null,
    cost: null,
    currency: null,
    rate: null,
    charge: "all",
    bookingRef: null,
    link: null,
    notes: null,
    needsReview: false,
    version: 1,
    createdBy: "u1",
    createdAt: 1000,
    participantIds: [],
    ...overrides,
  };
}

function gap(overrides: Partial<Gap> = {}): Gap {
  return {
    index: 1,
    kind: "between",
    from: { name: "Cartagena", code: "CTG", tz: null },
    to: { name: "Santa Marta", code: "SMR", tz: null },
    date: "2027-03-19",
    window: { from: "2027-03-15", to: "2027-03-19" },
    ...overrides,
  };
}

describe("durationMinutes", () => {
  it("is the time between departure and arrival in one zone", () => {
    const t = transfer({
      departTime: "09:40",
      departTz: BOGOTA,
      arriveTime: "11:05",
      arriveTz: BOGOTA,
    });

    expect(durationMinutes(t)).toBe(85);
  });

  it("counts across time zones", () => {
    // 22:00 in Bogotá (UTC-5) is 03:00 UTC; 15:00 in Madrid (UTC+1) is 14:00 UTC.
    const t = transfer({
      departTime: "22:00",
      departTz: BOGOTA,
      arriveDate: "2027-03-16",
      arriveTime: "15:00",
      arriveTz: "Europe/Madrid",
    });

    expect(durationMinutes(t)).toBe(11 * 60);
  });

  it("compares wall clocks when neither end has a zone", () => {
    const t = transfer({ departTime: "09:40", arriveTime: "11:05" });

    expect(durationMinutes(t)).toBe(85);
  });

  it("is unknown when only one end has a zone", () => {
    const t = transfer({ departTime: "09:40", departTz: BOGOTA, arriveTime: "11:05" });

    expect(durationMinutes(t)).toBeNull();
  });

  it("is unknown when a time is missing", () => {
    expect(durationMinutes(transfer({ departTime: "09:40" }))).toBeNull();
    expect(durationMinutes(transfer({ arriveTime: "11:05" }))).toBeNull();
  });

  it("is negative when arrival is before departure", () => {
    const t = transfer({ departTime: "11:05", arriveTime: "09:40" });

    expect(durationMinutes(t)).toBe(-85);
  });
});

describe("dayOffset", () => {
  it("is 0 without an arrival date or on the same day", () => {
    expect(dayOffset(transfer())).toBe(0);
    expect(dayOffset(transfer({ arriveDate: "2027-03-15" }))).toBe(0);
  });

  it("counts the days from departure date to arrival date", () => {
    expect(dayOffset(transfer({ arriveDate: "2027-03-16" }))).toBe(1);
    expect(dayOffset(transfer({ arriveDate: "2027-03-17" }))).toBe(2);
  });
});

describe("sortTransfers", () => {
  it("orders by gap, then departure date and time, then creation", () => {
    const sorted = sortTransfers([
      transfer({ id: "late", gap: 1, departDate: "2027-03-19", departTime: "14:00" }),
      transfer({ id: "next-gap", gap: 2 }),
      transfer({ id: "early", gap: 1, departDate: "2027-03-19", departTime: "08:00" }),
      transfer({ id: "day-before", gap: 1, departDate: "2027-03-18", departTime: "23:00" }),
      transfer({ id: "tie-b", gap: 0, departTime: "10:00", createdAt: 2000 }),
      transfer({ id: "tie-a", gap: 0, departTime: "10:00", createdAt: 1000 }),
    ]);

    expect(sorted.map((t) => t.id)).toEqual([
      "tie-a",
      "tie-b",
      "day-before",
      "early",
      "late",
      "next-gap",
    ]);
  });

  it("puts a transfer with no time before timed ones of the same day", () => {
    const sorted = sortTransfers([
      transfer({ id: "timed", departTime: "06:00" }),
      transfer({ id: "untimed", departTime: null }),
    ]);

    expect(sorted.map((t) => t.id)).toEqual(["untimed", "timed"]);
  });

  it("does not change its input", () => {
    const input = [transfer({ id: "b", gap: 1 }), transfer({ id: "a", gap: 0 })];

    sortTransfers(input);

    expect(input.map((t) => t.id)).toEqual(["b", "a"]);
  });
});

describe("outsideWindow", () => {
  it("is false inside the window, bounds included", () => {
    expect(outsideWindow(transfer({ departDate: "2027-03-15" }), gap())).toBe(false);
    expect(outsideWindow(transfer({ departDate: "2027-03-17" }), gap())).toBe(false);
    expect(outsideWindow(transfer({ departDate: "2027-03-19" }), gap())).toBe(false);
  });

  it("is true before the start or after the end", () => {
    expect(outsideWindow(transfer({ departDate: "2027-03-14" }), gap())).toBe(true);
    expect(outsideWindow(transfer({ departDate: "2027-03-20" }), gap())).toBe(true);
  });

  it("ignores an open bound", () => {
    const open = gap({ window: { from: null, to: "2027-03-19" } });

    expect(outsideWindow(transfer({ departDate: "2020-01-01" }), open)).toBe(false);
    expect(outsideWindow(transfer({ departDate: "2027-03-20" }), open)).toBe(true);
  });

  it("is false when the gap no longer exists", () => {
    expect(outsideWindow(transfer(), undefined)).toBe(false);
  });
});

describe("routeChanged", () => {
  it("is false when from and to still match the gap cities", () => {
    expect(routeChanged(transfer({ from: "Cartagena", to: "Santa Marta" }), gap())).toBe(false);
  });

  it("ignores case and accents", () => {
    expect(routeChanged(transfer({ from: "CARTAGENA", to: "santa marta" }), gap())).toBe(false);
    expect(
      routeChanged(
        transfer({ from: "bogota", to: "SANTA MARTA" }),
        gap({ from: { name: "Bogotá", code: "BOG", tz: null } }),
      ),
    ).toBe(false);
  });

  it("is true when a city differs", () => {
    expect(routeChanged(transfer({ from: "Cartagena", to: "Medellín" }), gap())).toBe(true);
    expect(routeChanged(transfer({ from: "Medellín", to: "Santa Marta" }), gap())).toBe(true);
  });

  it("is true when the gap no longer exists", () => {
    expect(routeChanged(transfer(), undefined)).toBe(true);
  });

  it("checks only the destination of an outbound gap", () => {
    const outbound = gap({ kind: "outbound", to: { name: "Cartagena", code: "CTG", tz: null } });

    expect(routeChanged(transfer({ from: "Medellín", to: "Cartagena" }), outbound)).toBe(false);
    expect(routeChanged(transfer({ from: "Medellín", to: "Lima" }), outbound)).toBe(true);
  });

  it("checks only the origin of a synthetic return gap", () => {
    const back = gap({
      kind: "return",
      from: { name: "Santa Marta", code: "SMR", tz: null },
      to: { name: "Bogotá", code: "BOG", tz: null },
    });

    expect(routeChanged(transfer({ from: "Santa Marta", to: "Medellín" }), back)).toBe(false);
    expect(routeChanged(transfer({ from: "Lima", to: "Bogotá" }), back)).toBe(true);
  });
});

describe("costInTripCurrency", () => {
  it("is null without a cost", () => {
    expect(costInTripCurrency(transfer())).toBeNull();
  });

  it("applies the stored rate to the minor units", () => {
    expect(costInTripCurrency(transfer({ cost: 18000, currency: "USD", rate: "4000" }))).toBe(
      72_000_000,
    );
  });

  it("keeps the cost when there is no rate", () => {
    expect(costInTripCurrency(transfer({ cost: 18000, currency: "COP", rate: null }))).toBe(18000);
  });
});

describe("isPast", () => {
  const AFTER_TAKEOFF = Date.parse("2027-03-15T15:00:00Z");

  it("is true once the departure instant has passed", () => {
    // 09:40 in Bogotá is 14:40 UTC.
    const t = transfer({ departTime: "09:40", departTz: BOGOTA });

    expect(isPast(t, AFTER_TAKEOFF)).toBe(true);
    expect(isPast(t, Date.parse("2027-03-15T14:00:00Z"))).toBe(false);
  });

  it("keeps a transfer with no time upcoming until its day ends", () => {
    const t = transfer({ departTime: null });

    expect(isPast(t, Date.parse("2027-03-15T20:00:00Z"))).toBe(false);
    expect(isPast(t, Date.parse("2027-03-16T00:00:01Z"))).toBe(true);
  });
});
