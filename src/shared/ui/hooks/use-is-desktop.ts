"use client";

import { useSyncExternalStore } from "react";

/** Tailwind's `lg` breakpoint, read from the token so the two never drift. */
function query(): string {
  const lg = getComputedStyle(document.documentElement).getPropertyValue("--breakpoint-lg");
  return `(width >= ${lg.trim()})`;
}

function subscribe(onChange: () => void): () => void {
  if (typeof window.matchMedia !== "function") {
    return () => {};
  }
  const media = window.matchMedia(query());
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/**
 * True from the `lg` breakpoint up. The server and first paint assume a
 * phone, so mobile-only controls never flash on phones.
 */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => typeof window.matchMedia === "function" && window.matchMedia(query()).matches,
    () => false,
  );
}
