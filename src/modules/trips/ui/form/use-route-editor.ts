"use client";

import { useState } from "react";
import type { CityRef } from "@/modules/trips/domain/trip";

const MAX_LEGS = 10;
const EMPTY_CITY: CityRef = { cityId: null, code: "", name: "" };

/** A leg as edited: `From` is derived (origin, or the previous leg's To), so it never drifts. */
type EditorStop = { key: number; to: CityRef; date: string };

export type EditorLeg = {
  key: number;
  from: CityRef;
  to: CityRef;
  /** `YYYY-MM-DD` or "" when not set. */
  date: string;
};

/** What changed last, for the live region and the focus rules. `id` makes repeats distinct. */
export type RouteChange = { id: number; kind: "added" | "removed"; number: number };

type State = { origin: CityRef; stops: EditorStop[]; nextKey: number; change: RouteChange | null };

const INITIAL: State = {
  origin: EMPTY_CITY,
  stops: [{ key: 0, to: EMPTY_CITY, date: "" }],
  nextKey: 1,
  change: null,
};

function sameName(a: CityRef, b: CityRef): boolean {
  return a.name.trim().toLowerCase() === b.name.trim().toLowerCase();
}

/** Route state for the trip form: legs chained from one origin, 1 to 10 legs. */
export function useRouteEditor() {
  const [state, setState] = useState<State>(INITIAL);
  const { origin, stops, change } = state;

  const legs: EditorLeg[] = stops.map((stop, index) => ({
    key: stop.key,
    from: index === 0 ? origin : (stops[index - 1]?.to ?? EMPTY_CITY),
    to: stop.to,
    date: stop.date,
  }));

  const last = stops[stops.length - 1];
  const canAddLeg = stops.length < MAX_LEGS;
  const canRemoveLeg = stops.length > 1;
  const canAddReturnHome =
    canAddLeg &&
    origin.name !== "" &&
    last !== undefined &&
    last.to.name !== "" &&
    !sameName(last.to, origin);

  function append(to: CityRef) {
    setState((current) => {
      if (current.stops.length >= MAX_LEGS) {
        return current;
      }
      const stop: EditorStop = { key: current.nextKey, to, date: "" };
      return {
        ...current,
        stops: [...current.stops, stop],
        nextKey: current.nextKey + 1,
        change: { id: current.nextKey, kind: "added", number: current.stops.length + 1 },
      };
    });
  }

  function updateStop(index: number, patch: Partial<EditorStop>) {
    setState((current) => ({
      ...current,
      stops: current.stops.map((stop, i) => (i === index ? { ...stop, ...patch } : stop)),
    }));
  }

  return {
    origin,
    legs,
    change,
    canAddLeg,
    canRemoveLeg,
    canAddReturnHome,
    setOrigin: (city: CityRef) => setState((current) => ({ ...current, origin: city })),
    setTo: (index: number, to: CityRef) => updateStop(index, { to }),
    setDate: (index: number, date: string) => updateStop(index, { date }),
    addLeg: () => append(EMPTY_CITY),
    addReturnHome: () => append(origin),
    removeLeg: (index: number) =>
      setState((current) => {
        if (current.stops.length <= 1) {
          return current;
        }
        return {
          ...current,
          stops: current.stops.filter((_, i) => i !== index),
          change: { id: current.nextKey, kind: "removed", number: index + 1 },
          nextKey: current.nextKey + 1,
        };
      }),
  };
}
