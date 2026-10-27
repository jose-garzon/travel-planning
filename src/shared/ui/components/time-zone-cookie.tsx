"use client";

import { useEffect } from "react";

export const TIME_ZONE_COOKIE = "tz";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Stores the browser's IANA time zone once in the `tz` cookie so the
 * server can compute the user's local "today" (feature 005 plan D-5).
 */
export function TimeZoneCookie() {
  useEffect(() => {
    const hasCookie = document.cookie.split("; ").some((c) => c.startsWith(`${TIME_ZONE_COOKIE}=`));
    if (hasCookie) {
      return;
    }
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    document.cookie = `${TIME_ZONE_COOKIE}=${encodeURIComponent(timeZone)}; Max-Age=${ONE_YEAR_SECONDS}; Path=/; SameSite=Lax`;
  }, []);

  return null;
}
