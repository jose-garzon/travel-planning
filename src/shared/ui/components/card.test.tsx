import { fireEvent, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "../../../../tests/setup/intl";
import { Card, CardButton, CardLink } from "./card";

// `next-intl`'s navigation `Link` imports `next/navigation`, which
// Vitest's Node ESM loader (no "exports" map on this `next` version)
// cannot resolve outside a real Next.js build. Stubbed with a plain
// `<a>` so `CardLink`'s own behavior (href, accessible name, marker)
// is still asserted for real.
vi.mock("@/shared/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: ComponentProps<"a">) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("Card", () => {
  it("renders as a static container with no interactive element", () => {
    renderWithIntl(<Card heading="Museo del Oro" />);

    expect(screen.getByText("Museo del Oro")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("translates a translateId heading", () => {
    renderWithIntl(<Card heading={{ translateId: "common.appName" }} />);

    expect(screen.getByText("Parche")).toBeInTheDocument();
  });

  it("carries the data-ui=card marker on its root element", () => {
    renderWithIntl(<Card heading="Museo del Oro" />);

    expect(document.querySelector('[data-ui="card"]')).toBeInTheDocument();
  });
});

describe("CardButton", () => {
  it("renders a native type=button button", () => {
    renderWithIntl(<CardButton heading="Museo del Oro" onClick={() => {}} />);

    expect(screen.getByRole("button", { name: "Museo del Oro" })).toHaveAttribute("type", "button");
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    renderWithIntl(<CardButton heading="Museo del Oro" onClick={onClick} />);

    fireEvent.click(screen.getByRole("button", { name: "Museo del Oro" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("carries the data-ui=card-button marker", () => {
    renderWithIntl(<CardButton heading="Museo del Oro" onClick={() => {}} />);

    expect(document.querySelector('[data-ui="card-button"]')).toBeInTheDocument();
  });

  it("translates a translateId heading", () => {
    renderWithIntl(<CardButton heading={{ translateId: "common.appName" }} onClick={() => {}} />);

    expect(screen.getByRole("button", { name: "Parche" })).toBeInTheDocument();
  });
});

describe("CardLink", () => {
  it("renders an anchor with the given href", () => {
    renderWithIntl(<CardLink heading="Museo del Oro" href="/trips/1" />);

    expect(screen.getByRole("link", { name: "Museo del Oro" })).toHaveAttribute("href", "/trips/1");
  });

  it("carries the data-ui=card-link marker", () => {
    renderWithIntl(<CardLink heading="Museo del Oro" href="/trips/1" />);

    expect(document.querySelector('[data-ui="card-link"]')).toBeInTheDocument();
  });
});
