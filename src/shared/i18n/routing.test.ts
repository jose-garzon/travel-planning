import { describe, expect, it } from "vitest";
import { routing } from "./routing";

describe("routing", () => {
  it("supports English and Spanish with English as default", () => {
    expect(routing.locales).toEqual(["en", "es"]);

    expect(routing.defaultLocale).toBe("en");
  });
});
