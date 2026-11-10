"use client";

import { CircleAlert, X } from "lucide-react";
import type { ReactNode } from "react";
import { useId, useState } from "react";
import type { CityRef } from "@/modules/trips/domain/trip";
import { CityCombobox } from "@/modules/trips/ui/form/city-combobox";
import { Button } from "@/shared/ui/components/button";
import { DateChip } from "@/shared/ui/components/date-chip";
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
  /** Legs after the first: the From station is the stop above, so it is
   * not drawn again (it stays for assistive tech) and the line runs on. */
  isContinuation?: boolean;
  /** More legs follow: the line runs through this leg's To station. */
  hasNext?: boolean;
  /** Under the To station, before the next one (the insert-stop button). */
  after?: ReactNode;
  /** Under the From station of leg 1 (insert a stop right after the origin). */
  afterFrom?: ReactNode;
  /** Month the calendar opens on when no date is set. */
  suggestedMonth?: string;
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
  isContinuation = false,
  hasNext = false,
  after,
  afterFrom,
  suggestedMonth,
}: LegFieldsProps) {
  const translate = useTranslatable();
  const dateId = useId();
  const [isToPlaced, setIsToPlaced] = useState(isInitiallyPlaced);
  const placed = isToPlaced && toName !== "";

  return (
    <fieldset className="group/leg relative">
      <legend className="sr-only">
        {translate({ translateId: "trips.form.leg", values: { number: legNumber } })}
      </legend>
      <ol className="route">
        {isContinuation ? (
          <li className="sr-only">
            <Input
              appearance="station"
              label={{ translateId: "trips.form.from" }}
              value={fromName ?? ""}
              readOnly
              tabIndex={-1}
            />
          </li>
        ) : (
          <li
            className={cx(
              "route-stop route-stop-hub",
              placed && "route-stop-extend",
              afterFrom !== undefined && "route-stop-through",
            )}
          >
            <div className="flex items-center gap-4">
              <div className="min-w-0">
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
              </div>
              <span className="shrink-0 rounded-full bg-line px-3 py-1 font-semibold text-on-accent">
                {translate({ translateId: "trips.form.takeoff" })}
              </span>
            </div>
            {afterFrom}
          </li>
        )}
        <li
          className={cx(
            "route-stop",
            placed ? "route-stop-new" : "route-stop-open",
            isContinuation && "route-stop-continue",
            hasNext && "route-stop-through",
          )}
        >
          {onRemove && (
            <div className="absolute top-0 right-0">
              <Button
                ref={removeRef}
                type="button"
                variant="outline"
                icon={X}
                labelHidden
                title={translate({
                  translateId: "trips.form.removeLeg",
                  values: { number: legNumber },
                })}
                onClick={onRemove}
                translateId="trips.form.removeLeg"
                values={{ number: legNumber }}
              />
            </div>
          )}
          <div className={onRemove ? "pe-14" : undefined}>
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
          </div>
          <StationMeta>
            <div className="flex flex-col gap-1">
              <label htmlFor={dateId} className="font-semibold text-text-muted text-xs uppercase">
                {translate({ translateId: "trips.form.date" })}{" "}
                <span className="font-regular normal-case">
                  ({translate({ translateId: "trips.form.dateHint" })})
                </span>
              </label>
              <DateChip
                id={dateId}
                value={date}
                onChange={onDateChange}
                pickerLabel={{ translateId: "trips.form.pickDate" }}
                suggestedMonth={suggestedMonth}
                invalid={dateError !== undefined}
                describedBy={dateError === undefined ? undefined : `${dateId}-error`}
              />
            </div>
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
          {after}
        </li>
      </ol>
    </fieldset>
  );
}
