// Client component: reads/writes `document.documentElement.dataset.theme`
// and `document.cookie` directly (D-16). No React state: a click never
// re-renders, it only mutates the DOM and the cookie jar.
"use client";

import { Moon, Sun } from "lucide-react";
import { buttonClasses } from "@/shared/ui/components/button";
import { cx } from "@/shared/ui/cx";
import {
  oppositeTheme,
  THEME_COOKIE,
  THEME_COOKIE_MAX_AGE_SECONDS,
  type Theme,
} from "@/shared/ui/theme";
import type { Translatable } from "@/shared/ui/translatable";
import { useTranslatable } from "@/shared/ui/translatable";

type ThemeToggleProps = {
  toDarkLabel: Translatable;
  toLightLabel: Translatable;
};

/** The theme currently in effect: `html[data-theme]`, else the OS scheme. */
function currentTheme(): Theme {
  const attr = document.documentElement.dataset.theme;
  if (attr === "light" || attr === "dark") {
    return attr;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function handleClick() {
  const next = oppositeTheme(currentTheme());
  document.documentElement.dataset.theme = next;
  try {
    document.cookie = `${THEME_COOKIE}=${next}; Max-Age=${THEME_COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`;
  } catch {
    // Cookie write failure is silent (private browsing storage caps, etc).
  }
}

/**
 * Icon-only button that flips the theme with no JS state: it toggles
 * `data-theme` and the theme cookie straight from the click handler.
 * Its accessible name needs no JS either — CSS shows the matching
 * icon and sr-only label for the current theme (D-16).
 */
export function ThemeToggle({ toDarkLabel, toLightLabel }: ThemeToggleProps) {
  const translate = useTranslatable();

  return (
    <button
      type="button"
      data-ui="theme-toggle"
      onClick={handleClick}
      className={buttonClasses({ variant: "secondary", labelHidden: true })}
    >
      <Moon data-ui="icon" aria-hidden="true" className={cx("size-icon-md", "dark:hidden")} />
      <span className="sr-only dark:hidden">{translate(toDarkLabel)}</span>
      <Sun data-ui="icon" aria-hidden="true" className={cx("size-icon-md", "hidden dark:inline")} />
      <span className="sr-only hidden dark:inline">{translate(toLightLabel)}</span>
    </button>
  );
}
