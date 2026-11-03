import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "../../../../../tests/setup/intl";
import NotFound from "./not-found";

vi.mock("@/shared/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("trip not-found", () => {
  it("says the trip is missing and links home", () => {
    renderWithIntl(<NotFound />, {
      messages: {
        trips: {
          edit: { notFound: "This trip doesn't exist or isn't yours.", goHome: "Go home" },
        },
      },
    });

    expect(screen.getByText("This trip doesn't exist or isn't yours.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go home" })).toHaveAttribute("href", "/");
  });
});
