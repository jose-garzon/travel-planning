import { describe, expect, it } from "vitest";
import { isValidDisplayName } from "./display-name-rule";

describe("isValidDisplayName", () => {
  it("returns false when the name has 0 characters", () => {
    const result = isValidDisplayName("");

    expect(result).toBe(false);
  });

  it("returns true when the name has 1 character", () => {
    const result = isValidDisplayName("A");

    expect(result).toBe(true);
  });

  it("returns true when the name has 50 characters", () => {
    const result = isValidDisplayName("a".repeat(50));

    expect(result).toBe(true);
  });

  it("returns false when the name has 51 characters", () => {
    const result = isValidDisplayName("a".repeat(51));

    expect(result).toBe(false);
  });
});
