/** `HH:MM` in the locale's clock: "8:00 AM" (en), "08:00" (es). */
export function formatTime(time: string, locale: string): string {
  const twelveHour = new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hour12;
  return new Intl.DateTimeFormat(locale, {
    hour: twelveHour ? "numeric" : "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`1970-01-01T${time}:00Z`));
}

export function formatDay(date: string, locale: string, style: "short" | "long"): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: style,
    month: style,
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}
