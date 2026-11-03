import { useRef, useState } from "react";
import type { RouteRule } from "@/modules/trips/domain/route";
import { isSameCity, validateRoute } from "@/modules/trips/domain/route";
import type { CityRef, Leg } from "@/modules/trips/domain/trip";
import type { Translatable } from "@/shared/ui/translatable";

export const MAX_LEGS = 10;

const EMPTY_CITY: CityRef = { cityId: null, code: "", name: "" };

/** A leg being edited. `date` is `YYYY-MM-DD` or "" when not set. */
export type EditorLeg = {
  id: string;
  from: CityRef;
  to: CityRef;
  date: string;
  /** The return home leg: its To city follows the first leg's From. */
  isReturn: boolean;
};

/** What the last add/remove did, so the form can announce it and move focus. */
export type RouteChange = {
  kind: "added" | "removed";
  legNumber: number;
  /** Leg whose field gets focus; null means the "Add a leg" button. */
  focusLegId: string | null;
  seq: number;
};

/** Each leg starts where the previous one ends; a return leg ends at the origin. */
function rechain(legs: EditorLeg[]): EditorLeg[] {
  return legs.map((leg, index) => {
    const from = index === 0 ? leg.from : (legs[index - 1] as EditorLeg).to;
    const to = leg.isReturn ? (legs[0] as EditorLeg).from : leg.to;

    return { ...leg, from, to };
  });
}

/** Route editing state: add, remove (re-chaining), return home, limits. */
export function useRouteEditor(initial?: Leg[]) {
  const nextId = useRef(0);
  const nextSeq = useRef(0);
  const newLeg = (from: CityRef, to: CityRef, isReturn = false): EditorLeg => {
    nextId.current += 1;

    return { id: `leg-${nextId.current}`, from, to, date: "", isReturn };
  };

  const [legs, setLegs] = useState<EditorLeg[]>(() => {
    if (initial === undefined || initial.length === 0) {
      return [newLeg(EMPTY_CITY, EMPTY_CITY)];
    }
    const origin = initial[0] as Leg;

    // A saved last leg that ends where the route began is the return home leg.
    return initial.map((leg, index) => ({
      ...newLeg(
        leg.from,
        leg.to,
        index > 0 && index === initial.length - 1 && isSameCity(leg.to, origin.from),
      ),
      date: leg.date ?? "",
    }));
  });
  const [change, setChange] = useState<RouteChange | null>(null);

  const first = legs[0] as EditorLeg;
  const last = legs[legs.length - 1] as EditorLeg;
  const canAddLeg = legs.length < MAX_LEGS;
  const canRemoveLeg = legs.length > 1;
  const canAddReturnHome =
    canAddLeg && last.to.name !== "" && first.from.name !== "" && !isSameCity(last.to, first.from);

  function announce(kind: RouteChange["kind"], legNumber: number, focusLegId: string | null) {
    nextSeq.current += 1;
    setChange({ kind, legNumber, focusLegId, seq: nextSeq.current });
  }

  function append(leg: EditorLeg) {
    setLegs([...legs, leg]);
    announce("added", legs.length + 1, leg.id);
  }

  function update(index: number, patch: Partial<EditorLeg>) {
    setLegs(rechain(legs.map((leg, i) => (i === index ? { ...leg, ...patch } : leg))));
  }

  return {
    legs,
    change,
    canAddLeg,
    canRemoveLeg,
    canAddReturnHome,
    addLeg() {
      if (canAddLeg) {
        append(newLeg(last.to, EMPTY_CITY));
      }
    },
    addReturnHome() {
      if (canAddReturnHome) {
        append(newLeg(last.to, first.from, true));
      }
    },
    removeLeg(index: number) {
      if (!canRemoveLeg) {
        return;
      }
      const remaining = legs.filter((_, i) => i !== index);
      const [head, ...rest] = remaining as [EditorLeg, ...EditorLeg[]];
      // The origin of a removed first leg is gone with it: the user picks it again.
      setLegs(rechain(index === 0 ? [{ ...head, from: EMPTY_CITY }, ...rest] : remaining));
      announce("removed", index + 1, legs[index - 1]?.id ?? null);
    },
    setFrom: (index: number, from: CityRef) => update(index, { from }),
    setTo: (index: number, to: CityRef) => update(index, { to }),
    setDate: (index: number, date: string) => update(index, { date }),
  };
}

export type LegErrors = { from?: Translatable; to?: Translatable; date?: Translatable };

function requiredErrors(leg: EditorLeg): LegErrors {
  return {
    ...(leg.from.name === "" && { from: { translateId: "trips.form.errors.fromRequired" } }),
    ...(leg.to.name === "" && { to: { translateId: "trips.form.errors.toRequired" } }),
  } as LegErrors;
}

function ruleError(rule: RouteRule, legs: EditorLeg[], index: number): LegErrors {
  const leg = legs[index] as EditorLeg;
  if (rule === "SAME_CITY") {
    const isBlank = leg.from.name === "" || leg.to.name === "";

    return isBlank ? {} : { to: { translateId: "trips.form.errors.sameCity" } };
  }
  if (rule === "DATE_PAST") {
    return { date: { translateId: "trips.form.errors.datePast" } };
  }
  if (rule === "DATE_ORDER") {
    const previous = legs
      .slice(0, index)
      .map((other) => other.date)
      .filter((date) => date !== "")
      .pop();

    return {
      date: { translateId: "trips.form.errors.dateOrder", values: { date: previous ?? "" } },
    };
  }

  return {};
}

/** Inline errors per leg: required cities plus the same route rules the server runs. */
export function legErrors({
  legs,
  today,
  previousLegs,
}: {
  legs: EditorLeg[];
  today: string;
  /** The saved route when editing: unchanged dates are not "past". */
  previousLegs?: Leg[];
}): LegErrors[] {
  const violations = validateRoute({
    legs: legs.map(({ from, to, date }) => ({ from, to, date: date === "" ? null : date })),
    today,
    previousLegs,
  });

  return legs.map((leg, index) =>
    violations
      .filter((found) => found.legIndex === index)
      .reduce<LegErrors>(
        (errors, found) => ({ ...errors, ...ruleError(found.rule, legs, index) }),
        requiredErrors(leg),
      ),
  );
}
