"use client";

import { CircleAlert } from "lucide-react";
import { useId, useState } from "react";
import type { CityRef } from "@/modules/trips/domain/trip";
import { CityCombobox } from "@/modules/trips/ui/form/city-combobox";
import { Button } from "@/shared/ui/components/button";
import { Icon } from "@/shared/ui/components/icon";
import { Input } from "@/shared/ui/components/input";
import { cx } from "@/shared/ui/cx";
import type { Translatable } from "@/shared/ui/translatable";
import { useTranslatable } from "@/shared/ui/translatable";

type LegFieldsProps = {
  legNumber: number;
  /** Leg 1 edits its From; later legs show the previous To, read-only. */
  fromName: string | null;
  /** Text the From field starts with (leg 1 of a saved trip). */
  initialFromName?: string;
  /** The To station starts placed (a saved trip), not open. */
  isInitiallyPlaced?: boolean;
  /** Text the To field starts with (a return home leg starts at the origin). */
  initialToName?: string;
  dateError?: Translatable;
  onRemove?: () => void;
  removeRef?: React.Ref<HTMLButtonElement>;
  fromError?: Translatable;
  toError?: Translatable;
  fromRef?: React.Ref<HTMLInputElement>;
  toRef?: React.Ref<HTMLInputElement>;
  onFromChange: (city: CityRef) => void;
  onToChange: (city: CityRef) => void;
  /** To city as typed: the station is placed once it has one and loses focus. */
  toName: string;
  /** City id of the From, so the To list does not offer it. */
  fromCityId?: string | null;
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
  fromName,
  initialFromName,
  isInitiallyPlaced = false,
  initialToName,
  dateError,
  onRemove,
  removeRef,
  fromError,
  toError,
  fromRef,
  toRef,
  onFromChange,
  onToChange,
  toName,
  fromCityId = null,
  date,
  onDateChange,
}: LegFieldsProps) {
  const translate = useTranslatable();
  const dateId = useId();
  const [isToPlaced, setIsToPlaced] = useState(isInitiallyPlaced);
  const placed = isToPlaced && toName !== "";

  return (
    <fieldset>
      <legend className="sr-only">
        {translate({ translateId: "trips.form.leg", values: { number: legNumber } })}
      </legend>
      <ol className="route">
        <li className={cx("route-stop route-stop-hub", placed && "route-stop-extend")}>
          {fromName === null ? (
            <CityCombobox
              ref={fromRef}
              label={{ translateId: "trips.form.from" }}
              placeholder={translate({ translateId: "trips.form.fromPlaceholder" })}
              error={fromError}
              defaultValue={initialFromName}
              onChange={onFromChange}
            />
          ) : (
            <Input
              appearance="station"
              label={{ translateId: "trips.form.from" }}
              value={fromName}
              readOnly
            />
          )}
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
            defaultValue={initialToName}
            exclude={fromCityId}
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
                aria-invalid={dateError === undefined ? undefined : true}
                aria-describedby={dateError === undefined ? undefined : `${dateId}-error`}
                className="date-chip"
              />
            </label>
          </StationMeta>
          <div aria-live="polite">
            {dateError !== undefined && (
              <p id={`${dateId}-error`} className="mt-1 text-sm text-error">
                <span className="inline-flex items-center gap-1">
                  <Icon icon={CircleAlert} size="sm" />
                  {translate(dateError)}
                </span>
              </p>
            )}
          </div>
        </li>
      </ol>
      {onRemove && (
        <Button
          ref={removeRef}
          type="button"
          variant="outline"
          onClick={onRemove}
          translateId="trips.form.removeLeg"
          values={{ number: legNumber }}
        />
      )}
    </fieldset>
  );
}
