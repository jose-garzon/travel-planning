export const THEME_COOKIE = "parche-theme";
export const THEME_COOKIE_MAX_AGE_SECONDS = 31_536_000;

export type Theme = "light" | "dark";

/** Parses a cookie value into a `Theme`, or `undefined` when it is missing or unknown. */
export function parseTheme(value: string | undefined): Theme | undefined {
  return value === "light" || value === "dark" ? value : undefined;
}

/** Returns the theme that is not `theme`. */
export function oppositeTheme(theme: Theme): Theme {
  return theme === "dark" ? "light" : "dark";
}
