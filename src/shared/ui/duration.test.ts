import { describe, expect, it } from "vitest";
import { formatDuration } from "@/shared/ui/duration";

/** ICU may use no-break spaces; compare with plain ones. */
function plain(text: string): string {
  return text.replace(/\s/g, " ");
}

describe("formatDuration", () => {
  it("writes hours and minutes compactly in English", () => {
    expect(plain(formatDuration(85, "en"))).toBe("1h 25m");
  });

  it("writes hours and minutes with spaces in Spanish", () => {
    expect(plain(formatDuration(85, "es"))).toBe("1 h 25 min");
  });

  it("drops minutes on a whole number of hours", () => {
    expect(plain(formatDuration(120, "en"))).toBe("2h");
    expect(plain(formatDuration(120, "es"))).toBe("2 h");
  });

  it("drops hours under one hour", () => {
    expect(plain(formatDuration(45, "en"))).toBe("45m");
    expect(plain(formatDuration(45, "es"))).toBe("45 min");
  });

  it("spells units out for screen readers", () => {
    expect(plain(formatDuration(85, "en", "long"))).toBe("1 hour 25 minutes");
  });

  it("carries past 24 hours into hours, not days", () => {
    expect(plain(formatDuration(26 * 60 + 5, "en"))).toBe("26h 5m");
  });
});
