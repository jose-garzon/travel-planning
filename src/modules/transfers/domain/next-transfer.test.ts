import { describe, expect, it } from "vitest";
import { daysUntil, nextTransfer } from "@/modules/transfers/domain/next-transfer";

type Item = {
  id: string;
  departDate: string;
  departTime: string | null;
  departTz: string | null;
};

function item(id: string, departDate: string, departTime: string | null = null): Item {
  return { id, departDate, departTime, departTz: "UTC" };
}

const at = (iso: string) => Date.parse(iso);

describe("nextTransfer", () => {
  it("returns null without transfers", () => {
    expect(nextTransfer([], at("2027-03-13T10:00:00Z"))).toBeNull();
  });

  it("skips a transfer that already left", () => {
    const past = item("past", "2027-03-15", "09:40");
    const upcoming = item("upcoming", "2027-03-19", "08:00");
    expect(nextTransfer([past, upcoming], at("2027-03-17T10:00:00Z"))?.id).toBe("upcoming");
  });

  it("returns null when every transfer is past", () => {
    expect(nextTransfer([item("a", "2027-03-15", "09:40")], at("2027-03-17T10:00:00Z"))).toBeNull();
  });

  it("picks the earliest upcoming one whatever the input order", () => {
    const later = item("later", "2027-03-19", "08:00");
    const sooner = item("sooner", "2027-03-16", "08:00");
    expect(nextTransfer([later, sooner], at("2027-03-13T10:00:00Z"))?.id).toBe("sooner");
  });

  it("counts a transfer later today as next", () => {
    const today = item("today", "2027-03-13", "18:00");
    const tomorrow = item("tomorrow", "2027-03-14", "08:00");
    expect(nextTransfer([tomorrow, today], at("2027-03-13T10:00:00Z"))?.id).toBe("today");
  });

  it("skips one that left earlier today", () => {
    const left = item("left", "2027-03-13", "06:00");
    const tomorrow = item("tomorrow", "2027-03-14", "08:00");
    expect(nextTransfer([left, tomorrow], at("2027-03-13T10:00:00Z"))?.id).toBe("tomorrow");
  });

  it("keeps a date-only transfer next through its whole day", () => {
    const dateOnly = item("date-only", "2027-03-13");
    expect(nextTransfer([dateOnly], at("2027-03-13T23:00:00Z"))?.id).toBe("date-only");
    expect(nextTransfer([dateOnly], at("2027-03-14T00:00:00Z"))).toBeNull();
  });

  it("breaks a tie on time by input order", () => {
    const first = item("first", "2027-03-19", "08:00");
    const second = item("second", "2027-03-19", "08:00");
    expect(nextTransfer([first, second], at("2027-03-13T10:00:00Z"))?.id).toBe("first");
  });
});

describe("daysUntil", () => {
  it("counts whole days from today", () => {
    expect(daysUntil("2027-03-15", at("2027-03-13T22:00:00Z"))).toBe(2);
  });

  it("is 0 on the day itself", () => {
    expect(daysUntil("2027-03-13", at("2027-03-13T01:00:00Z"))).toBe(0);
  });

  it("never goes below 0", () => {
    expect(daysUntil("2027-03-10", at("2027-03-13T01:00:00Z"))).toBe(0);
  });
});
