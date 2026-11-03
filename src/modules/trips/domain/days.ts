const DAY_MS = 86_400_000;

export function utcMs(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

/** Whole days from `from` to `to` (`YYYY-MM-DD`); negative when `to` is earlier. */
export function daysBetween({ from, to }: { from: string; to: string }): number {
  return Math.round((utcMs(to) - utcMs(from)) / DAY_MS);
}

export function addDays(date: string, days: number): string {
  return new Date(utcMs(date) + days * DAY_MS).toISOString().slice(0, 10);
}
