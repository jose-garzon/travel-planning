"use client";

import { useId, useState } from "react";
import type { CityRef } from "@/modules/trips/domain/trip";
import { CityCombobox } from "@/modules/trips/ui/form/city-combobox";
import { cx } from "@/shared/ui/cx";
import type { Translatable } from "@/shared/ui/translatable";
import { useTranslatable } from "@/shared/ui/translatable";

type LegFieldsProps = {
  legNumber: number;
  fromError?: Translatable;
  toError?: Translatable;
  fromRef?: React.Ref<HTMLInputElement>;
  toRef?: React.Ref<HTMLInputElement>;
  onFromChange: (city: CityRef) => void;
  onToChange: (city: CityRef) => void;
  /** To city as typed: the station is placed once it has one and loses focus. */
  toName: string;
  /** Departure date, `YYYY-MM-DD` or "" when not set yet. */
  date: string;
  onDateChange: (date: string) => void;
};

/** The amber meta line under a station: time lives here (DESIGN.md). */
function StationMeta({ children }: { children: React.ReactNode }) {
  return <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">{children}</div>;
}

/**
 * One leg drawn on the line (DESIGN.md signature). The stations are the
 * controls: each city field is set as a station name. The To station
 * stays open (dashed ring) until it holds a city and the user moves on;
 * then the segment from the takeoff draws down and its ring pops.
 * The departure date sits in the To station's meta line, as an amber
 * time chip.
 */
export function LegFields({
  legNumber,
  fromError,
  toError,
  fromRef,
  toRef,
  onFromChange,
  onToChange,
  toName,
  date,
  onDateChange,
}: LegFieldsProps) {
  const translate = useTranslatable();
  const dateId = useId();
  const [isToPlaced, setIsToPlaced] = useState(false);
  const placed = isToPlaced && toName !== "";

  return (
    <fieldset>
      <legend className="sr-only">
        {translate({ translateId: "trips.form.leg", values: { number: legNumber } })}
      </legend>
      <ol className="route">
        <li className={cx("route-stop route-stop-hub", placed && "route-stop-extend")}>
          <CityCombobox
            ref={fromRef}
            label={{ translateId: "trips.form.from" }}
            placeholder={translate({ translateId: "trips.form.fromPlaceholder" })}
            error={fromError}
            onChange={onFromChange}
          />
          <StationMeta>
            <span className="rounded-full bg-sun px-3 py-1 font-semibold text-on-sun">
              {translate({ translateId: "trips.form.takeoff" })}
            </span>
          </StationMeta>
        </li>
        <li className={cx("route-stop", placed ? "route-stop-new" : "route-stop-open")}>
          <CityCombobox
            ref={toRef}
            label={{ translateId: "trips.form.to" }}
            placeholder={translate({ translateId: "trips.form.toPlaceholder" })}
            error={toError}
            onChange={(city) => {
              onToChange(city);
              if (city.name === "") {
                setIsToPlaced(false);
              }
            }}
            onCommit={() => setIsToPlaced(true)}
          />
          <StationMeta>
            <label
              htmlFor={dateId}
              className="inline-flex min-h-touch items-center gap-2 rounded-full bg-sun px-4 font-semibold text-on-sun"
            >
              <span>
                {translate({ translateId: "trips.form.date" })}{" "}
                <span className="font-regular">
                  ({translate({ translateId: "trips.form.dateHint" })})
                </span>
              </span>
              <input
                id={dateId}
                type="date"
                value={date}
                onChange={(event) => onDateChange(event.target.value)}
                className="date-chip"
              />
            </label>
          </StationMeta>
        </li>
      </ol>
    </fieldset>
  );
}
