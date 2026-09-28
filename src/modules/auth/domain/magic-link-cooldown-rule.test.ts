import { describe, expect, it } from "vitest";
import { hasReachedMagicLinkCooldown } from "./magic-link-cooldown-rule";

describe("hasReachedMagicLinkCooldown", () => {
  it("returns false when there are no recent requests", () => {
    expect(hasReachedMagicLinkCooldown(0)).toBe(false);
  });

  it("returns false when recentCount is just below the threshold", () => {
    expect(hasReachedMagicLinkCooldown(2)).toBe(false);
  });

  it("returns true when recentCount reaches the threshold", () => {
    expect(hasReachedMagicLinkCooldown(3)).toBe(true);
  });

  it("returns true when recentCount is above the threshold", () => {
    expect(hasReachedMagicLinkCooldown(4)).toBe(true);
  });
});
