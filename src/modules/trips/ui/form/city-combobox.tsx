"use client";

import { useState } from "react";
import type { CityRef } from "@/modules/trips/domain/trip";
import { Input } from "@/shared/ui/components/input";
import type { Translatable } from "@/shared/ui/translatable";

type CityComboboxProps = {
  label: Translatable;
  error?: Translatable;
  onChange: (city: CityRef) => void;
  /** Fires when the user leaves the field: the station is placed. */
  onCommit?: () => void;
  placeholder?: string;
  ref?: React.Ref<HTMLInputElement>;
};

/** Free text city: no id, code is the first 3 letters uppercased (feature.md "Alternate flows" 4a). */
function freeTextCity(text: string): CityRef {
  const name = text.trim();

  return { cityId: null, code: name.slice(0, 3).toUpperCase(), name };
}

/** Stub: a plain labelled text input producing a free-text `CityRef`. */
export function CityCombobox({
  label,
  error,
  onChange,
  onCommit,
  placeholder,
  ref,
}: CityComboboxProps) {
  const [text, setText] = useState("");

  return (
    <Input
      ref={ref}
      appearance="station"
      label={label}
      error={error}
      placeholder={placeholder}
      autoComplete="off"
      onBlur={onCommit}
      value={text}
      onChange={(event) => {
        setText(event.target.value);
        onChange(freeTextCity(event.target.value));
      }}
    />
  );
}
