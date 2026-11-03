// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { CityRef } from "@/modules/trips/domain/trip";
import { useRouteEditor } from "@/modules/trips/ui/form/use-route-editor";

afterEach(cleanup);

function city(name: string): CityRef {
  return { cityId: null, code: name.slice(0, 3).toUpperCase(), name };
}

function setup() {
  return renderHook(() => useRouteEditor());
}

describe("useRouteEditor", () => {
  it("starts with one empty leg that cannot be removed", () => {
    const { result } = setup();

    expect(result.current.legs).toHaveLength(1);
    expect(result.current.canRemoveLeg).toBe(false);
    expect(result.current.canAddLeg).toBe(true);
  });

  it("chains a new leg from the previous To", () => {
    const { result } = setup();

    act(() => result.current.setOrigin(city("Bogotá")));
    act(() => result.current.setTo(0, city("Madrid")));
    act(() => result.current.addLeg());

    expect(result.current.legs).toHaveLength(2);
    expect(result.current.legs[1]?.from.name).toBe("Madrid");
    expect(result.current.legs[0]?.from.name).toBe("Bogotá");
  });

  it("re-chains the next leg when a middle leg is removed", () => {
    const { result } = setup();

    act(() => result.current.setOrigin(city("Bogotá")));
    act(() => result.current.setTo(0, city("Madrid")));
    act(() => result.current.addLeg());
    act(() => result.current.setTo(1, city("Rome")));
    act(() => result.current.addLeg());
    act(() => result.current.setTo(2, city("Paris")));
    act(() => result.current.removeLeg(1));

    expect(result.current.legs.map((leg) => leg.to.name)).toEqual(["Madrid", "Paris"]);
    expect(result.current.legs[1]?.from.name).toBe("Madrid");
  });

  it("keeps the dates of the remaining legs on removal", () => {
    const { result } = setup();

    act(() => result.current.addLeg());
    act(() => result.current.setDate(0, "2026-11-01"));
    act(() => result.current.setDate(1, "2026-11-05"));
    act(() => result.current.removeLeg(0));

    expect(result.current.legs).toHaveLength(1);
    expect(result.current.legs[0]?.date).toBe("2026-11-05");
  });

  it("adds a return home leg from the last To to the origin, once", () => {
    const { result } = setup();

    act(() => result.current.setOrigin(city("Bogotá")));
    act(() => result.current.setTo(0, city("Madrid")));
    expect(result.current.canAddReturnHome).toBe(true);
    act(() => result.current.addReturnHome());

    expect(result.current.legs[1]?.from.name).toBe("Madrid");
    expect(result.current.legs[1]?.to.name).toBe("Bogotá");
    expect(result.current.canAddReturnHome).toBe(false);
  });

  it("cannot add a return home leg without an origin and a last stop", () => {
    const { result } = setup();

    expect(result.current.canAddReturnHome).toBe(false);
    act(() => result.current.setOrigin(city("Bogotá")));
    expect(result.current.canAddReturnHome).toBe(false);
  });

  it("limits the route to 10 legs", () => {
    const { result } = setup();

    for (let i = 0; i < 12; i++) {
      act(() => result.current.addLeg());
    }

    expect(result.current.legs).toHaveLength(10);
    expect(result.current.canAddLeg).toBe(false);
    expect(result.current.canAddReturnHome).toBe(false);
  });

  it("never removes the only leg", () => {
    const { result } = setup();

    act(() => result.current.removeLeg(0));

    expect(result.current.legs).toHaveLength(1);
  });

  it("reports the last change for the live region and focus", () => {
    const { result } = setup();

    act(() => result.current.addLeg());
    expect(result.current.change).toMatchObject({ kind: "added", number: 2 });
    act(() => result.current.removeLeg(1));
    expect(result.current.change).toMatchObject({ kind: "removed", number: 2 });
  });
});
