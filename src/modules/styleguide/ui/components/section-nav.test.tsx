import { act, createEvent, fireEvent, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import buttonEn from "@/modules/styleguide/messages/en/button.json";
import cardEn from "@/modules/styleguide/messages/en/card.json";
import dialogEn from "@/modules/styleguide/messages/en/dialog.json";
import inputEn from "@/modules/styleguide/messages/en/input.json";
import layoutEn from "@/modules/styleguide/messages/en/layout.json";
import tooltipEn from "@/modules/styleguide/messages/en/tooltip.json";
import { renderWithIntl } from "../../../../../tests/setup/intl";
import { SectionNav } from "./section-nav";

// SectionNav pulls in the Primitives sub-nav labels, which transitively
// imports card.tsx (CardDemo -> Card/CardButton). card.tsx also
// exports CardLink, which imports `@/shared/i18n/navigation`'s `Link`,
// itself backed by `next/navigation` -- unresolvable by Vitest's Node
// ESM loader outside a real Next.js build (see card.test.tsx). Stubbed
// the same way here; SectionNav never renders a `Link`.
vi.mock("@/shared/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: ComponentProps<"a">) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const messages = {
  styleguide: {
    button: buttonEn,
    card: cardEn,
    dialog: dialogEn,
    input: inputEn,
    layout: layoutEn,
    tooltip: tooltipEn,
  },
};

const LINKS = [
  { id: "motion", label: "Motion" },
  { id: "spacing", label: "Spacing" },
  { id: "primitives", label: "Primitives" },
];

/** Captures every `IntersectionObserver` the component under test creates. */
class MockIntersectionObserver implements IntersectionObserver {
  static instances: MockIntersectionObserver[] = [];

  readonly root = null;
  readonly rootMargin: string;
  readonly thresholds: ReadonlyArray<number> = [];
  callback: IntersectionObserverCallback;
  observed: Element[] = [];

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.rootMargin = options?.rootMargin ?? "";
    MockIntersectionObserver.instances.push(this);
  }

  observe(target: Element) {
    this.observed.push(target);
  }
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

/** The `IntersectionObserver` `SectionNav` created on mount, or throws. */
function theObserver(): MockIntersectionObserver {
  const observer = MockIntersectionObserver.instances[0];
  if (observer === undefined) {
    throw new Error("SectionNav did not create an IntersectionObserver");
  }
  return observer;
}

function fakeEntry(target: Element, top: number, isIntersecting = true): IntersectionObserverEntry {
  return {
    target,
    isIntersecting,
    boundingClientRect: { top } as DOMRectReadOnly,
    intersectionRatio: isIntersecting ? 1 : 0,
    intersectionRect: {} as DOMRectReadOnly,
    rootBounds: null,
    time: 0,
  };
}

/**
 * Renders `SectionNav` alongside stub `<section>`/`<h2>` elements for
 * each top-level link and the Primitives sub-demo headings, mirroring
 * how `StyleguideScreen` wires sections next to the nav in production.
 */
function renderNav() {
  return renderWithIntl(
    <>
      <SectionNav label="Styleguide sections" links={LINKS} />
      <section id="motion">
        <h2 id="motion-heading" tabIndex={-1}>
          Motion
        </h2>
      </section>
      <section id="spacing">
        <h2 id="spacing-heading" tabIndex={-1}>
          Spacing
        </h2>
      </section>
      <section id="primitives">
        <h2 id="primitives-heading" tabIndex={-1}>
          Primitives
        </h2>
      </section>
    </>,
    { messages },
  );
}

describe("SectionNav", () => {
  beforeEach(() => {
    MockIntersectionObserver.instances = [];
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    HTMLElement.prototype.scrollIntoView = vi.fn();
    vi.spyOn(history, "replaceState").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders a link for every top-level section pointing to its id", () => {
    renderNav();

    expect(screen.getByRole("link", { name: "Motion" })).toHaveAttribute("href", "#motion");
    expect(screen.getByRole("link", { name: "Spacing" })).toHaveAttribute("href", "#spacing");
  });

  it("nests a jump link for every Primitives sub-demo under the Primitives item", () => {
    renderNav();

    expect(screen.getByRole("link", { name: "Stack and Text" })).toHaveAttribute(
      "href",
      "#layout-demo-heading",
    );
    expect(screen.getByRole("link", { name: "Button" })).toHaveAttribute(
      "href",
      "#button-demo-heading",
    );
    expect(screen.getByRole("link", { name: "Input" })).toHaveAttribute(
      "href",
      "#input-demo-heading",
    );
    expect(screen.getByRole("link", { name: "Tooltip" })).toHaveAttribute(
      "href",
      "#tooltip-demo-heading",
    );
    expect(screen.getByRole("link", { name: "Card" })).toHaveAttribute(
      "href",
      "#card-demo-heading",
    );
    expect(screen.getByRole("link", { name: "Dialog" })).toHaveAttribute(
      "href",
      "#dialog-demo-heading",
    );
  });

  it("has no active link before any click or intersection is reported", () => {
    renderNav();

    expect(document.querySelectorAll('[aria-current="location"]')).toHaveLength(0);
  });

  it("marks a link active and gives its section heading focus when clicked", () => {
    renderNav();

    fireEvent.click(screen.getByRole("link", { name: "Motion" }));

    expect(screen.getByRole("link", { name: "Motion" })).toHaveAttribute(
      "aria-current",
      "location",
    );
    expect(screen.getByRole("heading", { name: "Motion" })).toHaveFocus();
  });

  it("prevents the default anchor navigation on click", () => {
    renderNav();
    const link = screen.getByRole("link", { name: "Motion" });
    const clickEvent = createEvent.click(link);

    fireEvent(link, clickEvent);

    expect(clickEvent.defaultPrevented).toBe(true);
  });

  it("scrolls the heading into view smoothly when the user has no reduced-motion preference", () => {
    renderNav();

    fireEvent.click(screen.getByRole("link", { name: "Motion" }));

    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });

  it("scrolls the heading instantly when the user prefers reduced motion", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    renderNav();

    fireEvent.click(screen.getByRole("link", { name: "Motion" }));

    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });
  });

  it("replaces the history entry with the section's hash on click", () => {
    renderNav();

    fireEvent.click(screen.getByRole("link", { name: "Motion" }));

    expect(history.replaceState).toHaveBeenCalledWith(null, "", "#motion");
  });

  it("does not attach click behavior to the nested Primitives sub-links", () => {
    renderNav();
    const link = screen.getByRole("link", { name: "Button" });
    const clickEvent = createEvent.click(link);

    fireEvent(link, clickEvent);

    expect(clickEvent.defaultPrevented).toBe(false);
    expect(HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled();
    expect(history.replaceState).not.toHaveBeenCalled();
  });

  it("never sets aria-current on a nested Primitives sub-link", () => {
    renderNav();

    fireEvent.click(screen.getByRole("link", { name: "Button" }));

    expect(screen.getByRole("link", { name: "Button" })).not.toHaveAttribute("aria-current");
  });

  it("watches every top-level section with one IntersectionObserver using rootMargin -60% at the bottom", () => {
    renderNav();

    expect(MockIntersectionObserver.instances).toHaveLength(1);
    const observer = theObserver();
    expect(observer.rootMargin).toBe("0% 0% -60% 0%");
    expect(observer.observed.map((el) => el.id).sort()).toEqual(
      ["motion", "spacing", "primitives"].sort(),
    );
  });

  it("activates the top-most intersecting section reported by the scroll-spy observer", () => {
    renderNav();
    const observer = theObserver();
    const motionSection = document.getElementById("motion");
    const spacingSection = document.getElementById("spacing");
    if (motionSection === null || spacingSection === null) {
      throw new Error("test fixture sections are missing");
    }

    act(() => {
      observer.callback([fakeEntry(motionSection, 120), fakeEntry(spacingSection, 10)], observer);
    });

    expect(screen.getByRole("link", { name: "Spacing" })).toHaveAttribute(
      "aria-current",
      "location",
    );
    expect(screen.getByRole("link", { name: "Motion" })).not.toHaveAttribute("aria-current");
  });

  it("keeps only one top-level link active as the observer reports a new topmost section", () => {
    renderNav();
    const observer = theObserver();
    const motionSection = document.getElementById("motion");
    const spacingSection = document.getElementById("spacing");
    if (motionSection === null || spacingSection === null) {
      throw new Error("test fixture sections are missing");
    }

    act(() => {
      observer.callback([fakeEntry(motionSection, 10)], observer);
    });
    act(() => {
      observer.callback([fakeEntry(spacingSection, 10)], observer);
    });

    expect(document.querySelectorAll('[aria-current="location"]')).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Spacing" })).toHaveAttribute(
      "aria-current",
      "location",
    );
  });

  it("ignores intersection entries that are not currently intersecting", () => {
    renderNav();
    const observer = theObserver();
    const motionSection = document.getElementById("motion");
    if (motionSection === null) {
      throw new Error("test fixture section is missing");
    }

    act(() => {
      observer.callback([fakeEntry(motionSection, 10, false)], observer);
    });

    expect(document.querySelectorAll('[aria-current="location"]')).toHaveLength(0);
  });
});
