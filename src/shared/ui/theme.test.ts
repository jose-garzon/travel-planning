import { describe, expect, it } from "vitest";
import { oppositeTheme, parseTheme, THEME_COOKIE, THEME_COOKIE_MAX_AGE_SECONDS } from "./theme";

describe("THEME_COOKIE", () => {
  it("is named parche-theme", () => {
    expect(THEME_COOKIE).toBe("parche-theme");
  });
});

describe("THEME_COOKIE_MAX_AGE_SECONDS", () => {
  it("is one year in seconds", () => {
    expect(THEME_COOKIE_MAX_AGE_SECONDS).toBe(31_536_000);
  });
});

describe("parseTheme", () => {
  it("returns light when given the light value", () => {
    expect(parseTheme("light")).toBe("light");
  });

  it("returns dark when given the dark value", () => {
    expect(parseTheme("dark")).toBe("dark");
  });

  it("returns undefined when given an unknown value", () => {
    expect(parseTheme("blue")).toBeUndefined();
  });

  it("returns undefined when given undefined", () => {
    expect(parseTheme(undefined)).toBeUndefined();
  });
});

describe("oppositeTheme", () => {
  it("returns dark when given light", () => {
    expect(oppositeTheme("light")).toBe("dark");
  });

  it("returns light when given dark", () => {
    expect(oppositeTheme("dark")).toBe("light");
  });
});
