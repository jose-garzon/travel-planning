"use client";

import { useLocale } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import type { CityRef } from "@/modules/trips/domain/trip";
import type { CityOption } from "@/modules/trips/ui/form/use-city-search";
import { useCitySearch } from "@/modules/trips/ui/form/use-city-search";
import { Input } from "@/shared/ui/components/input";
import { cx } from "@/shared/ui/cx";
import type { Translatable } from "@/shared/ui/translatable";
import { useTranslatable } from "@/shared/ui/translatable";

const DEBOUNCE_MS = 150;

type CityComboboxProps = {
  label: Translatable;
  error?: Translatable;
  onChange: (city: CityRef) => void;
  /** Fires when the user picks a city or leaves the field: the station is placed. */
  onCommit?: () => void;
  /** City id of the leg's From: never offered as a destination. */
  exclude?: string | null;
  placeholder?: string;
  /** Text shown on mount (e.g. a return home leg starts at the origin). */
  defaultValue?: string;
  ref?: React.Ref<HTMLInputElement>;
};

/** Free text city: no id, code is the first 3 letters uppercased (feature.md "Alternate flows" 4a). */
function freeTextCity(text: string): CityRef {
  const name = text.trim();

  return { cityId: null, code: name.slice(0, 3).toUpperCase(), name };
}

/** Next active option, wrapping around the ends; -1 when there is none. */
function stepIndex(index: number, step: 1 | -1, count: number): number {
  if (count === 0) {
    return -1;
  }
  if (index < 0 && step < 0) {
    return count - 1;
  }
  return (index + step + count) % count;
}

/**
 * City field with suggestions (WAI-ARIA combobox, list autocomplete).
 * The list opens on focus with popular cities, narrows as the user
 * types (debounced, stale requests aborted) and never offers `exclude`.
 * Whatever is typed stays as a free-text city: picking is optional, and
 * "No city found" confirms it.
 */
export function CityCombobox({
  label,
  error,
  onChange,
  onCommit,
  exclude = null,
  placeholder,
  defaultValue = "",
  ref,
}: CityComboboxProps) {
  const translate = useTranslatable();
  const locale = useLocale();
  const listId = useId();
  const [text, setText] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const { options, isSettled, load, cancel, markPending } = useCitySearch({ locale, exclude });
  const [activeIndex, setActiveIndex] = useState(-1);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function cancelPending() {
    clearTimeout(timer.current);
    cancel();
  }

  function search(query: string) {
    setActiveIndex(-1);
    load(query);
  }

  function pick(city: CityOption) {
    cancelPending();
    setText(city.name);
    setIsOpen(false);
    onChange({ cityId: city.cityId, code: city.code, name: city.name });
    onCommit?.();
  }

  function keepFreeText() {
    cancelPending();
    setIsOpen(false);
    onCommit?.();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const { key } = event;
    if (key === "ArrowDown" && !isOpen) {
      event.preventDefault();
      setIsOpen(true);
      search(text);
    } else if (key === "ArrowDown" || key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => stepIndex(index, key === "ArrowDown" ? 1 : -1, options.length));
    } else if (key === "Escape" && isOpen) {
      event.preventDefault();
      setIsOpen(false);
    } else if (key === "Enter" && isOpen) {
      confirmActive(event);
    }
  }

  /** Enter picks the active option; with none, it only closes and lets the form submit. */
  function confirmActive(event: React.KeyboardEvent) {
    const active = options[activeIndex];
    if (active === undefined) {
      setIsOpen(false);
      return;
    }
    event.preventDefault();
    pick(active);
  }

  const hasNoResults = isSettled && options.length === 0 && text.trim() !== "";
  const optionId = (index: number) => `${listId}-${index}`;

  return (
    <div>
      <Input
        ref={ref}
        appearance="station"
        label={label}
        error={error}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        aria-activedescendant={isOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        value={text}
        onFocus={() => {
          setIsOpen(true);
          search(text);
        }}
        onBlur={keepFreeText}
        onKeyDown={handleKeyDown}
        onChange={(event) => {
          const next = event.target.value;
          setText(next);
          setIsOpen(true);
          markPending();
          cancelPending();
          timer.current = setTimeout(() => search(next), DEBOUNCE_MS);
          onChange(freeTextCity(next));
        }}
      />
      {isOpen && (options.length > 0 || hasNoResults) && (
        <Listbox
          id={listId}
          label={translate({ translateId: "trips.city.suggestions" })}
          options={options}
          activeIndex={activeIndex}
          optionId={optionId}
          onPick={pick}
          noResults={hasNoResults ? translate({ translateId: "trips.city.noResults" }) : null}
          onKeepFreeText={keepFreeText}
        />
      )}
      <div role="status" className="sr-only">
        {isOpen && isSettled && options.length > 0
          ? translate({ translateId: "trips.city.results", values: { count: options.length } })
          : ""}
      </div>
    </div>
  );
}

type ListboxProps = {
  id: string;
  label: string;
  options: CityOption[];
  activeIndex: number;
  optionId: (index: number) => string;
  onPick: (city: CityOption) => void;
  /** Text of the "no city found" option, or null when there are matches. */
  noResults: string | null;
  onKeepFreeText: () => void;
};

/**
 * Options never take focus: the input keeps it and points at the active one.
 * The list flows inline (not overlaid) so it never covers the Add stop buttons.
 */
function Listbox({
  id,
  label,
  options,
  activeIndex,
  optionId,
  onPick,
  noResults,
  onKeepFreeText,
}: ListboxProps) {
  return (
    <div
      id={id}
      role="listbox"
      aria-label={label}
      className="mt-1 max-h-72 overflow-y-auto rounded-md border border-border-strong bg-surface-1 py-1 shadow-md"
      // Keeps focus in the input while an option is pressed.
      onMouseDown={(event) => event.preventDefault()}
    >
      {options.map((city, index) => (
        // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard is handled by the combobox input (APG)
        <div
          key={city.cityId}
          id={optionId(index)}
          role="option"
          tabIndex={-1}
          aria-selected={index === activeIndex}
          onClick={() => onPick(city)}
          className={cx(
            "flex min-h-touch cursor-pointer items-baseline gap-3 px-4 py-2 text-text",
            index === activeIndex ? "bg-surface-3" : "ui-hover:bg-surface-2",
          )}
        >
          <span className="font-display font-bold tracking-wide">{city.code}</span>{" "}
          <span>{city.name}</span> <span className="text-sm text-text-muted">{city.country}</span>
        </div>
      ))}
      {noResults !== null && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard is handled by the combobox input (APG)
        <div
          role="option"
          tabIndex={-1}
          aria-selected={false}
          onClick={onKeepFreeText}
          className="min-h-touch cursor-pointer px-4 py-2 text-text-muted ui-hover:bg-surface-2"
        >
          {noResults}
        </div>
      )}
    </div>
  );
}
