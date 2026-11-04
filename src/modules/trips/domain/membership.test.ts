import { describe, expect, it } from "vitest";
import { canManageMembers, isFull, MAX_MEMBERS } from "@/modules/trips/domain/membership";

describe("canManageMembers", () => {
  it("allows the owner to manage members", () => {
    expect(canManageMembers("owner")).toBe(true);
  });

  it("does not allow an editor to manage members", () => {
    expect(canManageMembers("editor")).toBe(false);
  });
});

describe("isFull", () => {
  it("is false while the trip has room for one more member", () => {
    expect(isFull(MAX_MEMBERS - 1)).toBe(false);
  });

  it("is true once the trip has MAX_MEMBERS members", () => {
    expect(MAX_MEMBERS).toBe(20);
    expect(isFull(MAX_MEMBERS)).toBe(true);
  });
});
