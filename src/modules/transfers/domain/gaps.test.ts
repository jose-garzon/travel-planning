import { describe, expect, it } from "vitest";
import { type GapCity, gapsOf } from "@/modules/transfers/domain/gaps";

function city(name: string, code: string, tz: string | null = null): GapCity {
  return { name, code, tz };
}

const bogota = city("Bogotá", "BOG", "America/Bogota");
const cartagena = city("Cartagena", "CTG", "America/Bogota");
const santaMarta = city("Santa Marta", "SMR", "America/Bogota");
const lima = city("Lima", "LIM", "America/Lima");

describe("gapsOf", () => {
  it("gives no gaps to a route with no legs", () => {
    expect(gapsOf({ legs: [] })).toEqual([]);
  });

  it("gives one leg an outbound and a return gap", () => {
    const gaps = gapsOf({ legs: [{ from: bogota, to: lima, date: "2027-05-02" }] });

    expect(gaps).toEqual([
      {
        index: 0,
        kind: "outbound",
        from: bogota,
        to: lima,
        date: "2027-05-02",
        window: { from: null, to: "2027-05-02" },
      },
      {
        index: 1,
        kind: "return",
        from: lima,
        to: bogota,
        date: null,
        window: { from: "2027-05-02", to: null },
      },
    ]);
  });

  it("gives two legs ending away from the origin outbound, between and return gaps", () => {
    const gaps = gapsOf({
      legs: [
        { from: bogota, to: cartagena, date: "2027-03-15" },
        { from: cartagena, to: santaMarta, date: "2027-03-19" },
      ],
    });

    expect(gaps.map((gap) => [gap.index, gap.kind])).toEqual([
      [0, "outbound"],
      [1, "between"],
      [2, "return"],
    ]);
    expect(gaps[1]).toMatchObject({
      from: cartagena,
      to: santaMarta,
      date: "2027-03-19",
      window: { from: "2027-03-15", to: "2027-03-19" },
    });
    expect(gaps[2]).toMatchObject({ from: santaMarta, to: bogota });
  });

  it("adds no return gap when the last leg ends at the origin, and calls that leg the return", () => {
    const gaps = gapsOf({
      legs: [
        { from: bogota, to: lima, date: "2027-05-02" },
        { from: lima, to: bogota, date: "2027-05-09" },
      ],
    });

    expect(gaps.map((gap) => [gap.index, gap.kind])).toEqual([
      [0, "outbound"],
      [1, "return"],
    ]);
    expect(gaps[1]).toMatchObject({
      date: "2027-05-09",
      window: { from: "2027-05-02", to: "2027-05-09" },
    });
  });

  it("gives n legs n gaps plus the return gap, with windows from leg to leg", () => {
    const gaps = gapsOf({
      legs: [
        { from: bogota, to: cartagena, date: "2027-03-15" },
        { from: cartagena, to: santaMarta, date: "2027-03-19" },
        { from: santaMarta, to: lima, date: "2027-03-23" },
      ],
    });

    expect(gaps).toHaveLength(4);
    expect(gaps.map((gap) => gap.window)).toEqual([
      { from: null, to: "2027-03-15" },
      { from: "2027-03-15", to: "2027-03-19" },
      { from: "2027-03-19", to: "2027-03-23" },
      { from: "2027-03-23", to: null },
    ]);
  });

  it("keeps null dates and open windows for undated legs", () => {
    const gaps = gapsOf({
      legs: [
        { from: bogota, to: cartagena, date: null },
        { from: cartagena, to: santaMarta, date: null },
      ],
    });

    expect(gaps.map((gap) => [gap.date, gap.window])).toEqual([
      [null, { from: null, to: null }],
      [null, { from: null, to: null }],
      [null, { from: null, to: null }],
    ]);
  });

  it("carries each city's time zone", () => {
    const [outbound] = gapsOf({ legs: [{ from: bogota, to: lima, date: null }] });

    expect(outbound?.from?.tz).toBe("America/Bogota");
    expect(outbound?.to?.tz).toBe("America/Lima");
  });
});
