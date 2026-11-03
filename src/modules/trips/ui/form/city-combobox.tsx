"use client";

import { useLocale } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import type { CityRef } from "@/modules/trips/domain/trip";
import { Input } from "@/shared/ui/components/input";
import { type Translatable, useTranslatable } from "@/shared/ui/translatable";

type CityOption = { cityId: string; code: string; name: string; country: string };

type CityComboboxProps = {
  label: Translatable;
  error?: Translatable;
  onChange: (city: CityRef) => void;
  /** Fires when the user leaves the field: the station is placed. */
  onCommit?: () => void;
  /** City id left out of the list: the leg's From (EC-1). */
  exclude?: string | null;
  placeholder?: string;
  ref?: React.Ref<HTMLInputElement>;
};

const DEBOUNCE_MS = 150;
const NO_RESULTS = "none";

/** Free text city: no id, code is the first 3 letters uppercased (feature.md "Alternate flows" 4a). */
function freeTextCity(text: string): CityRef {
  const name = text.trim();

  return { cityId: null, code: name.slice(0, 3).toUpperCase(), name };
}

/** Region of the browser language (`es-CO` is `CO`), to rank popular cities. */
function browserRegion(): string | null {
  return typeof navigator === "undefined" ? null : (navigator.language.split("-")[1] ?? null);
}

/**
 * WAI-ARIA "Combobox with listbox popup" over `/api/v1/cities`. The
 * list opens on focus with popular cities, narrows as the user types
 * (debounced, stale requests aborted) and never blocks free text: the
 * typed name is the value until a city is picked.
 */
export function CityCombobox({
  label,
  error,
  onChange,
  onCommit,
  exclude = null,
  placeholder,
  ref,
}: CityComboboxProps) {
  const translate = useTranslatable();
  const locale = useLocale();
  const listId = useId();
  const [text, setText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<CityOption[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    },
    [],
  );

  const visible = options.filter((option) => option.cityId !== exclude);
  const showNoResults = hasLoaded && text.trim().length >= 2 && visible.length === 0;
  const rowCount = visible.length + (showNoResults ? 1 : 0);
  const optionId = (index: number) => `${listId}-${index}`;

  function load(query: string) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const params = new URLSearchParams({ locale });
    const trimmed = query.trim();
    if (trimmed.length >= 2) {
      params.set("q", trimmed);
    } else {
      const region = browserRegion();
      if (region !== null) {
        params.set("region", region);
      }
    }
    if (exclude !== null) {
      params.set("exclude", exclude);
    }

    fetch(`/api/v1/cities?${params}`, { signal: controller.signal })
      .then((response) => response.json() as Promise<{ items: CityOption[] }>)
      .then(({ items }) => {
        if (controller.signal.aborted) {
          return;
        }
        setOptions(items);
        setHasLoaded(true);
        setActiveIndex(-1);
      })
      .catch(() => {
        // Aborted or offline: the typed text still works as free text.
      });
  }

  function scheduleLoad(query: string) {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => load(query), DEBOUNCE_MS);
  }

  function pick(option: CityOption) {
    setText(option.name);
    setIsOpen(false);
    setActiveIndex(-1);
    onChange({ cityId: option.cityId, code: option.code, name: option.name });
  }

  function keepFreeText() {
    setIsOpen(false);
    setActiveIndex(-1);
    onChange(freeTextCity(text));
  }

  function selectRow(index: number) {
    const option = visible[index];
    if (option === undefined) {
      keepFreeText();
    } else {
      pick(option);
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (rowCount === 0) {
        return;
      }
      event.preventDefault();
      setIsOpen(true);
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => (current + step + rowCount) % rowCount);
    } else if (event.key === "Enter" && isOpen && activeIndex >= 0) {
      event.preventDefault();
      selectRow(activeIndex);
    } else if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  const listVisible = isOpen && rowCount > 0;

  return (
    <div className="relative">
      <Input
        ref={ref}
        appearance="station"
        label={label}
        error={error}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={listVisible}
        aria-controls={listVisible ? listId : undefined}
        aria-activedescendant={listVisible && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        value={text}
        onFocus={() => {
          setIsOpen(true);
          load(text);
        }}
        onBlur={() => {
          setIsOpen(false);
          onCommit?.();
        }}
        onKeyDown={onKeyDown}
        onChange={(event) => {
          setText(event.target.value);
          setIsOpen(true);
          onChange(freeTextCity(event.target.value));
          scheduleLoad(event.target.value);
        }}
      />
      {listVisible && (
        // Pointer picks must not blur the input first: mousedown is held.
        <div
          id={listId}
          role="listbox"
          aria-label={translate({ translateId: "trips.city.listLabel" })}
          onMouseDown={(event) => event.preventDefault()}
          className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-md border border-border-strong bg-surface-1 py-1 shadow-lg"
        >
          {visible.map((option, index) => (
            // biome-ignore lint/a11y/useKeyWithClickEvents: APG combobox: the input keeps focus and drives the options with aria-activedescendant.
            // biome-ignore lint/a11y/useFocusableInteractive: APG combobox: the input keeps focus and drives the options with aria-activedescendant.
            <div
              key={option.cityId}
              id={optionId(index)}
              role="option"
              aria-selected={index === activeIndex}
              onClick={() => pick(option)}
              className="flex min-h-touch cursor-pointer items-baseline gap-3 px-4 py-2 aria-selected:bg-surface-2 hover:bg-surface-2"
            >
              <span className="font-display font-bold tracking-wide text-accent">
                {option.code}
              </span>{" "}
              <span className="text-text">{option.name}</span>{" "}
              <span className="text-sm text-text-muted">{option.country}</span>
            </div>
          ))}
          {showNoResults && (
            // biome-ignore lint/a11y/useKeyWithClickEvents: APG combobox: the input keeps focus and drives the options with aria-activedescendant.
            // biome-ignore lint/a11y/useFocusableInteractive: APG combobox: the input keeps focus and drives the options with aria-activedescendant.
            <div
              id={optionId(visible.length)}
              role="option"
              aria-selected={activeIndex === visible.length}
              data-kind={NO_RESULTS}
              onClick={keepFreeText}
              className="min-h-touch cursor-pointer px-4 py-2 text-text-muted aria-selected:bg-surface-2 hover:bg-surface-2"
            >
              {translate({ translateId: "trips.city.noResults" })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
