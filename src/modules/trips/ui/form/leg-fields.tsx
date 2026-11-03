"use client";

import { X } from "lucide-react";
import { useId, useState } from "react";
import type { CityRef } from "@/modules/trips/domain/trip";
import { CityCombobox } from "@/modules/trips/ui/form/city-combobox";
import type { EditorLeg, LegErrors } from "@/modules/trips/ui/form/use-route-editor";
import { Button } from "@/shared/ui/components/button";
import { Input } from "@/shared/ui/components/input";
import { cx } from "@/shared/ui/cx";
import { useTranslatable } from "@/shared/ui/translatable";

type LegFieldsProps = {
  legNumber: number;
  leg: EditorLeg;
  errors: LegErrors;
  onFromChange: (city: CityRef) => void;
  onToChange: (city: CityRef) => void;
  onDateChange: (date: string) => void;
  onRemove: () => void;
  canRemove: boolean;
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
  leg,
  errors,
  onFromChange,
  onToChange,
  onDateChange,
  onRemove,
  canRemove,
}: LegFieldsProps) {
  const translate = useTranslatable();
  const dateId = useId();
  const dateErrorId = `${dateId}-error`;
  const [isToPlaced, setIsToPlaced] = useState(false);
  const placed = (isToPlaced || leg.isReturn) && leg.to.name !== "";
  const isFirst = legNumber === 1;

  return (
    <fieldset data-leg-id={leg.id}>
      <legend className="sr-only">
        {translate({ translateId: "trips.form.leg", values: { number: legNumber } })}
      </legend>
      <ol className="route">
        <li className={cx("route-stop route-stop-hub", placed && "route-stop-extend")}>
          {isFirst ? (
            <CityCombobox
              label={{ translateId: "trips.form.from" }}
              placeholder={translate({ translateId: "trips.form.fromPlaceholder" })}
              error={errors.from}
              onChange={onFromChange}
            />
          ) : (
            <Input
              appearance="station"
              label={{ translateId: "trips.form.from" }}
              value={leg.from.name}
              readOnly
            />
          )}
          {isFirst && (
            <StationMeta>
              <span className="rounded-full bg-sun px-3 py-1 font-semibold text-on-sun">
                {translate({ translateId: "trips.form.takeoff" })}
              </span>
            </StationMeta>
          )}
        </li>
        <li
          data-field="to"
          className={cx("route-stop", placed ? "route-stop-new" : "route-stop-open")}
        >
          {leg.isReturn ? (
            <Input
              appearance="station"
              label={{ translateId: "trips.form.to" }}
              value={leg.to.name}
              readOnly
            />
          ) : (
            <CityCombobox
              label={{ translateId: "trips.form.to" }}
              placeholder={translate({ translateId: "trips.form.toPlaceholder" })}
              error={errors.to}
              exclude={leg.from.cityId}
              onChange={(city) => {
                onToChange(city);
                if (city.name === "") {
                  setIsToPlaced(false);
                }
              }}
              onCommit={() => setIsToPlaced(true)}
            />
          )}
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
                value={leg.date}
                aria-invalid={errors.date === undefined ? undefined : true}
                aria-describedby={errors.date === undefined ? undefined : dateErrorId}
                onChange={(event) => onDateChange(event.target.value)}
                className="date-chip"
              />
            </label>
            <Button
              type="button"
              variant="outline"
              icon={X}
              labelHidden
              disabled={!canRemove}
              data-remove=""
              translateId="trips.form.removeLeg"
              values={{ number: legNumber }}
              onClick={onRemove}
            />
          </StationMeta>
          {errors.date !== undefined && (
            <p id={dateErrorId} className="mt-1 text-sm text-error">
              {translate(errors.date)}
            </p>
          )}
        </li>
      </ol>
    </fieldset>
  );
}
