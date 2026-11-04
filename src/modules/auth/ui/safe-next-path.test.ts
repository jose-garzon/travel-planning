import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/modules/auth/ui/safe-next-path";

describe("safeNextPath", () => {
  it("keeps a relative path inside the app", () => {
    expect(safeNextPath("/en/join/token-1/accept")).toBe("/en/join/token-1/accept");
  });

  it("rejects absolute URLs", () => {
    expect(safeNextPath("https://evil.example/trips")).toBeNull();
    expect(safeNextPath("http://evil.example")).toBeNull();
  });

  it("rejects protocol-relative URLs, including the backslash form browsers read as one", () => {
    expect(safeNextPath("//evil.example/trips")).toBeNull();
    expect(safeNextPath("/\\evil.example/trips")).toBeNull();
  });

  it("ignores a missing or empty value", () => {
    expect(safeNextPath(undefined)).toBeNull();
    expect(safeNextPath("")).toBeNull();
  });
});
