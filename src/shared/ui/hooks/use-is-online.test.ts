// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useIsOnline } from "@/shared/ui/hooks/use-is-online";

function setOnline(value: boolean) {
  Object.defineProperty(navigator, "onLine", { configurable: true, get: () => value });
}

afterEach(() => {
  Reflect.deleteProperty(navigator, "onLine");
});

describe("useIsOnline", () => {
  it("is true when the browser is online", () => {
    setOnline(true);

    const { result } = renderHook(() => useIsOnline());

    expect(result.current).toBe(true);
  });

  it("is false when the browser starts offline", () => {
    setOnline(false);

    const { result } = renderHook(() => useIsOnline());

    expect(result.current).toBe(false);
  });

  it("follows the browser's offline and online events", () => {
    setOnline(true);
    const { result } = renderHook(() => useIsOnline());

    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current).toBe(false);

    act(() => {
      setOnline(true);
      window.dispatchEvent(new Event("online"));
    });
    expect(result.current).toBe(true);
  });
});
