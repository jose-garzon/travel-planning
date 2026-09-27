// Client component: scroll-spy (plan "SectionNav behavior") needs
// state for the active link, an IntersectionObserver, and a click
// handler that moves focus and updates history.
"use client";

import type { MouseEvent } from "react";
import { useEffect, useState } from "react";
import { PRIMITIVES_SUB_NAV_LINKS } from "@/modules/styleguide/ui/sections/primitives-section";
import { cx } from "@/shared/ui/cx";
import type { Translatable } from "@/shared/ui/translatable";
import { useTranslatable } from "@/shared/ui/translatable";

type SectionNavLink = {
  id: string;
  label: Translatable;
};

type SectionNavProps = {
  label: Translatable;
  links: SectionNavLink[];
};

// Percent-only: a `px` value in this string fails the no-raw-values
// lint plugin (D-5/plan "SectionNav behavior").
const SCROLL_SPY_ROOT_MARGIN = "0% 0% -60% 0%";

function headingIdFor(sectionId: string): string {
  return `${sectionId}-heading`;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** The top-most section among the observer's currently intersecting entries. */
function topMostEntry(entries: IntersectionObserverEntry[]): IntersectionObserverEntry | null {
  const visible = entries.filter((entry) => entry.isIntersecting);
  if (visible.length === 0) {
    return null;
  }

  return visible.reduce((top, entry) =>
    entry.boundingClientRect.top < top.boundingClientRect.top ? entry : top,
  );
}

/**
 * Jump list to every top-level styleguide section, plus a nested,
 * always-plain list of jump links to the Primitives sub-demos (no
 * click handling, no active-state tracking, so they cannot affect
 * "only one section link is active").
 *
 * One `IntersectionObserver` watches the top-level sections and
 * highlights whichever is top-most in view. Clicking a top-level
 * link scrolls to and focuses its section heading immediately,
 * without waiting for the (possibly smooth) scroll to settle (plan
 * "SectionNav behavior").
 */
export function SectionNav({ label, links }: SectionNavProps) {
  const translate = useTranslatable();
  const [activeId, setActiveId] = useState<string | null>(null);

  // `links` is built once from the static STYLEGUIDE_SECTIONS list and
  // never changes identity across the page's lifetime.
  // biome-ignore lint/correctness/useExhaustiveDependencies: links is stable for the page's lifetime; re-subscribing on every render would be wasteful and is never needed.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      return;
    }

    const sections = links
      .map((link) => document.getElementById(link.id))
      .filter((section): section is HTMLElement => section !== null);

    if (sections.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const topMost = topMostEntry(entries);
        if (topMost !== null) {
          setActiveId(topMost.target.id);
        }
      },
      { rootMargin: SCROLL_SPY_ROOT_MARGIN },
    );

    for (const section of sections) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  function handleLinkClick(event: MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault();

    const heading = document.getElementById(headingIdFor(id));
    if (heading === null) {
      return;
    }

    heading.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
    heading.focus({ preventScroll: true });
    setActiveId(id);
    history.replaceState(null, "", `#${id}`);
  }

  return (
    <nav
      aria-label={translate(label)}
      className="md:sticky md:top-0 md:w-nav md:shrink-0 md:self-start md:pt-6 md:pb-6"
    >
      <ul className="flex flex-wrap gap-x-4 gap-y-2 md:flex-col">
        {links.map((link) => {
          const isActive = link.id === activeId;

          return (
            <li key={link.id}>
              <a
                href={`#${link.id}`}
                aria-current={isActive ? "location" : undefined}
                onClick={(event) => handleLinkClick(event, link.id)}
                className={cx(
                  "ui-hover:text-accent ui-hover:underline",
                  isActive && "text-accent underline",
                )}
              >
                {translate(link.label)}
              </a>
              {link.id === "primitives" && (
                <ul className="mt-2 flex flex-col gap-y-2 pl-4">
                  {PRIMITIVES_SUB_NAV_LINKS.map((sub) => (
                    <li key={sub.id}>
                      <a href={`#${sub.id}`} className="ui-hover:text-accent ui-hover:underline">
                        {translate(sub.label)}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
