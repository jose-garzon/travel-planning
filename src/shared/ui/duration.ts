const UNITS = [
  { unit: "hour", size: 60 },
  { unit: "minute", size: 1 },
] as const;

/**
 * A length of time for `locale`: "1h 25m" (en), "1 h 25 min" (es). `long`
 * spells the units out for screen readers ("1 hour 25 minutes"). Never
 * rolls hours into days.
 */
export function formatDuration(minutes: number, locale: string, style: "short" | "long" = "short") {
  const unitDisplay = style === "long" ? "long" : locale.startsWith("en") ? "narrow" : "short";
  const total = Math.round(Math.abs(minutes));
  const parts = UNITS.flatMap(({ unit, size }, index) => {
    const value = index === 0 ? Math.floor(total / size) : total % 60;
    return value === 0
      ? []
      : [new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay }).format(value)];
  });
  return parts.length === 0
    ? new Intl.NumberFormat(locale, { style: "unit", unit: "minute", unitDisplay }).format(0)
    : parts.join(" ");
}
