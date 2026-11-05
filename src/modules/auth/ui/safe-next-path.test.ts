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

  it("rejects control characters the URL parser strips, which would turn into a host", () => {
    expect(safeNextPath("/\t/evil.example/trips")).toBeNull();
    expect(safeNextPath("/\n/evil.example/trips")).toBeNull();
    expect(safeNextPath("/\r/evil.example/trips")).toBeNull();
    expect(safeNextPath("/en/\ttrips")).toBeNull();
  });

  it("rejects a backslash anywhere in the path", () => {
    expect(safeNextPath("/en\\trips")).toBeNull();
  });

  it("rejects script and other non-path schemes", () => {
    expect(safeNextPath("javascript:alert(1)")).toBeNull();
    expect(safeNextPath("/javascript:alert(1)//")).not.toMatch(/^javascript:/);
  });

  it("keeps an encoded tab as a harmless path and never leaves the origin", () => {
    expect(safeNextPath("/%09/evil.example/trips")).toBe("/%09/evil.example/trips");
  });

  it("keeps the query and fragment of a relative path", () => {
    expect(safeNextPath("/en/trips?a=1#top")).toBe("/en/trips?a=1#top");
  });

  it("rejects raw tab, newline and backslash tricks", () => {
    expect(safeNextPath("/\t/evil.example")).toBeNull();
    expect(safeNextPath("/\n/evil.example")).toBeNull();
    expect(safeNextPath("/\\evil.example")).toBeNull();
  });
});
