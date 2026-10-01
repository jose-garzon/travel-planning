import { describe, expect, it, vi } from "vitest";
import type { DisplayNameWriter } from "./set-display-name";
import { setDisplayName } from "./set-display-name";

function createWriter(): DisplayNameWriter {
  return { setDisplayName: vi.fn().mockResolvedValue(undefined) };
}

describe("setDisplayName", () => {
  it("rejects an empty name without writing", async () => {
    const writer = createWriter();

    const result = await setDisplayName("", writer);

    expect(result).toEqual({ ok: false, error: "INVALID_NAME" });
    expect(writer.setDisplayName).not.toHaveBeenCalled();
  });

  it("rejects a name over 50 characters without writing", async () => {
    const writer = createWriter();

    const result = await setDisplayName("a".repeat(51), writer);

    expect(result).toEqual({ ok: false, error: "INVALID_NAME" });
    expect(writer.setDisplayName).not.toHaveBeenCalled();
  });

  it("persists the name and a confirmation timestamp when valid", async () => {
    const writer = createWriter();

    const result = await setDisplayName("Ana", writer);

    expect(result).toEqual({ ok: true, value: undefined });
    expect(writer.setDisplayName).toHaveBeenCalledWith("Ana", expect.any(Date));
  });
});
