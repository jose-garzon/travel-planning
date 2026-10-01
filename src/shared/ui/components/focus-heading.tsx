"use client";

import { useEffect } from "react";

/**
 * Moves focus to the page's `<h1>` on mount (feature 003 plan
 * "Accessibility notes": after sign-in, focus moves to the home
 * page's heading — AC-13, asserted in the returning-member scenario).
 * Lives here, not in `trips/ui/home-screen.tsx`, because the
 * post-verify transition is `auth`'s concern (T02), not `trips`'s
 * (T03); `shared/ui` is the only place code that touches every page's
 * markup is allowed to live (architecture.md "app is a router" —
 * `app/[locale]/` itself may only hold Next route files).
 */
export function FocusHeading() {
  useEffect(() => {
    const heading = document.querySelector("h1");
    if (heading === null) {
      return;
    }

    if (!heading.hasAttribute("tabindex")) {
      heading.setAttribute("tabindex", "-1");
    }
    heading.focus();
  }, []);

  return null;
}
