// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CityRef } from "@/modules/trips/domain/trip";
import { legErrors, MAX_LEGS, useRouteEditor } from "@/modules/trips/ui/form/use-route-editor";

function city(name: string, cityId: string | null = null): CityRef {
  return { cityId, code: name.slice(0, 3).toUpperCase(), name };
}

const BOGOTA = city("Bogotá");
const MADRID = city("Madrid");
const ROME = city("Rome");
const PARIS = city("Paris");

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

  it("starts a new leg from the previous leg's To city", () => {
    const { result } = setup();

    act(() => result.current.setFrom(0, BOGOTA));
    act(() => result.current.setTo(0, MADRID));
    act(() => result.current.addLeg());

    expect(result.current.legs).toHaveLength(2);
    expect(result.current.legs[1]?.from).toEqual(MADRID);
  });

  it("keeps the chain when a To city changes", () => {
    const { result } = setup();

    act(() => result.current.setTo(0, MADRID));
    act(() => result.current.addLeg());
    act(() => result.current.setTo(0, ROME));

    expect(result.current.legs[1]?.from).toEqual(ROME);
  });

  it("re-chains the next leg when a middle leg is removed", () => {
    const { result } = setup();
    act(() => result.current.setFrom(0, BOGOTA));
    act(() => result.current.setTo(0, MADRID));
    act(() => result.current.addLeg());
    act(() => result.current.setTo(1, ROME));
    act(() => result.current.addLeg());
    act(() => result.current.setTo(2, PARIS));

    act(() => result.current.removeLeg(1));

    expect(result.current.legs).toHaveLength(2);
    expect(result.current.legs[1]?.from).toEqual(MADRID);
    expect(result.current.legs[1]?.to).toEqual(PARIS);
  });

  it("refuses to remove the only leg", () => {
    const { result } = setup();

    act(() => result.current.removeLeg(0));

    expect(result.current.legs).toHaveLength(1);
  });

  it("stops at 10 legs", () => {
    const { result } = setup();

    for (let count = 1; count < MAX_LEGS; count++) {
      act(() => result.current.addLeg());
    }
    expect(result.current.legs).toHaveLength(10);
    expect(result.current.canAddLeg).toBe(false);

    act(() => result.current.addLeg());

    expect(result.current.legs).toHaveLength(10);
  });

  it("adds a return home leg from the last stop to the first origin", () => {
    const { result } = setup();
    act(() => result.current.setFrom(0, BOGOTA));
    act(() => result.current.setTo(0, MADRID));
    expect(result.current.canAddReturnHome).toBe(true);

    act(() => result.current.addReturnHome());

    expect(result.current.legs).toHaveLength(2);
    expect(result.current.legs[1]?.from).toEqual(MADRID);
    expect(result.current.legs[1]?.to).toEqual(BOGOTA);
    expect(result.current.canAddReturnHome).toBe(false);
  });

  it("cannot add a return home leg before the route has a first origin and a stop", () => {
    const { result } = setup();

    expect(result.current.canAddReturnHome).toBe(false);
  });

  it("cannot add a return home leg when the last stop is already the origin", () => {
    const { result } = setup();
    act(() => result.current.setFrom(0, BOGOTA));
    act(() => result.current.setTo(0, MADRID));
    act(() => result.current.addLeg());
    act(() => result.current.setTo(1, city("  bogotá ")));

    expect(result.current.canAddReturnHome).toBe(false);
  });

  it("stores the date of a leg", () => {
    const { result } = setup();

    act(() => result.current.setDate(0, "2026-11-01"));

    expect(result.current.legs[0]?.date).toBe("2026-11-01");
  });

  it("reports what changed so the form can announce it and move focus", () => {
    const { result } = setup();
    act(() => result.current.addLeg());
    expect(result.current.change).toMatchObject({ kind: "added", legNumber: 2 });
    const addedId = result.current.legs[1]?.id;
    expect(result.current.change?.focusLegId).toBe(addedId);

    act(() => result.current.removeLeg(1));

    expect(result.current.change).toMatchObject({ kind: "removed", legNumber: 2 });
    expect(result.current.change?.focusLegId).toBe(result.current.legs[0]?.id);
  });

  it("focuses nothing in a leg after removing the first leg", () => {
    const { result } = setup();
    act(() => result.current.addLeg());

    act(() => result.current.removeLeg(0));

    expect(result.current.change).toMatchObject({ kind: "removed", legNumber: 1 });
    expect(result.current.change?.focusLegId).toBeNull();
  });
});

describe("legErrors", () => {
  const TODAY = "2026-10-26";

  function editorLeg(from: CityRef, to: CityRef, date = "") {
    return { id: "x", from, to, date, isReturn: false };
  }

  it("flags empty From and To", () => {
    const errors = legErrors({ legs: [editorLeg(city(""), city(""))], today: TODAY });

    expect(errors[0]?.from).toBeDefined();
    expect(errors[0]?.to).toBeDefined();
    expect(errors[0]?.date).toBeUndefined();
  });

  it("flags the To field when it repeats the From city", () => {
    const errors = legErrors({ legs: [editorLeg(BOGOTA, BOGOTA)], today: TODAY });

    expect(errors[0]?.to).toBeDefined();
  });

  it("flags a past date and a date out of order on the date field", () => {
    const errors = legErrors({
      legs: [
        editorLeg(BOGOTA, MADRID, "2026-10-25"),
        editorLeg(MADRID, ROME, "2026-11-10"),
        editorLeg(ROME, PARIS, "2026-11-05"),
      ],
      today: TODAY,
    });

    expect(errors[0]?.date).toBeDefined();
    expect(errors[1]?.date).toBeUndefined();
    expect(errors[2]?.date).toBeDefined();
  });

  it("returns no errors for a valid route", () => {
    const errors = legErrors({
      legs: [editorLeg(BOGOTA, MADRID, "2026-11-01"), editorLeg(MADRID, BOGOTA)],
      today: TODAY,
    });

    expect(errors.every((error) => !error.from && !error.to && !error.date)).toBe(true);
  });
});
