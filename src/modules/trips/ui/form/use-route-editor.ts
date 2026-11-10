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

/** The stop last removed and where it stood, so the removal can be undone. */
export type RemovedStop = { index: number; stop: EditorStop };

type State = {
  origin: CityRef;
  stops: EditorStop[];
  nextKey: number;
  change: RouteChange | null;
  removed: RemovedStop | null;
};

const INITIAL: State = {
  origin: EMPTY_CITY,
  stops: [{ key: 0, to: EMPTY_CITY, date: "" }],
  nextKey: 1,
  change: null,
  removed: null,
};

/** The route of a saved trip, as the editor starts with it. */
export type InitialLeg = { from: CityRef; to: CityRef; date: string | null };

function stateFrom(legs: InitialLeg[]): State {
  const [first] = legs;
  if (first === undefined) {
    return INITIAL;
  }
  return {
    origin: first.from,
    stops: legs.map((leg, key) => ({ key, to: leg.to, date: leg.date ?? "" })),
    nextKey: legs.length,
    change: null,
    removed: null,
  };
}

/** The day after `iso`, or "" when there is no date to follow. */
function nextDay(iso: string | undefined): string {
  if (!iso) {
    return "";
  }
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function sameName(a: CityRef, b: CityRef): boolean {
  return a.name.trim().toLowerCase() === b.name.trim().toLowerCase();
}

function stopAt(stops: EditorStop[], index: number): RemovedStop | null {
  const stop = stops[index];
  return stop === undefined ? null : { index, stop };
}

/** Route state for the trip form: legs chained from one origin, 1 to 10 legs. */
export function useRouteEditor(initialLegs: InitialLeg[] = []) {
  const [state, setState] = useState<State>(() => stateFrom(initialLegs));
  const { origin, stops, change, removed } = state;

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

  /** Adds a stop at `index` (the end when omitted), dated the day after the stop before it. */
  function insert(to: CityRef, index?: number) {
    setState((current) => {
      if (current.stops.length >= MAX_LEGS) {
        return current;
      }
      const at = Math.min(Math.max(index ?? current.stops.length, 0), current.stops.length);
      const stop: EditorStop = {
        key: current.nextKey,
        to,
        date: nextDay(current.stops[at - 1]?.date),
      };
      return {
        ...current,
        stops: [...current.stops.slice(0, at), stop, ...current.stops.slice(at)],
        nextKey: current.nextKey + 1,
        change: { id: current.nextKey, kind: "added", number: at + 1 },
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
    removed,
    canAddLeg,
    canRemoveLeg,
    canAddReturnHome,
    setOrigin: (city: CityRef) => setState((current) => ({ ...current, origin: city })),
    setTo: (index: number, to: CityRef) => updateStop(index, { to }),
    setDate: (index: number, date: string) => updateStop(index, { date }),
    addLeg: () => insert(EMPTY_CITY),
    /** A new stop before leg `index`: between two existing destinations. */
    insertLeg: (index: number) => insert(EMPTY_CITY, index),
    addReturnHome: () => insert(origin),
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
          removed: stopAt(current.stops, index),
        };
      }),
    /** Puts the last removed stop back where it was. */
    undoRemove: () =>
      setState((current) => {
        const last = current.removed;
        if (last === null || current.stops.length >= MAX_LEGS) {
          return { ...current, removed: null };
        }
        const at = Math.min(last.index, current.stops.length);
        return {
          ...current,
          stops: [...current.stops.slice(0, at), last.stop, ...current.stops.slice(at)],
          change: { id: current.nextKey, kind: "added", number: at + 1 },
          nextKey: current.nextKey + 1,
          removed: null,
        };
      }),
    /** The undo offer expired. */
    forgetRemoved: () => setState((current) => ({ ...current, removed: null })),
  };
}
