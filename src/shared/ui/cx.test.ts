import { describe, expect, it } from "vitest";
import { cx } from "./cx";

describe("cx", () => {
  it("joins multiple class strings with a single space", () => {
    const result = cx("bg-bg", "text-text", "font-body");

    expect(result).toBe("bg-bg text-text font-body");
  });

  it("drops falsy parts", () => {
    const result = cx("bg-bg", false, undefined, null, "", "text-text");

    expect(result).toBe("bg-bg text-text");
  });

  it("returns an empty string when every part is falsy", () => {
    const result = cx(false, undefined, null, "");

    expect(result).toBe("");
  });

  it("returns an empty string when called with no parts", () => {
    const result = cx();

    expect(result).toBe("");
  });

  it("keeps a single class as is", () => {
    const result = cx("rounded-full");

    expect(result).toBe("rounded-full");
  });
});
