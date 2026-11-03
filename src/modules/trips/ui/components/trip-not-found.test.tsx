import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import editMessages from "@/modules/trips/messages/en/edit.json";
import { TripNotFound } from "@/modules/trips/ui/components/trip-not-found";
import { renderWithIntl } from "../../../../../tests/setup/intl";

vi.mock("@/shared/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("TripNotFound", () => {
  it("says the trip is missing and links home", () => {
    renderWithIntl(<TripNotFound />, { messages: { trips: { edit: editMessages } } });

    expect(screen.getByText("This trip doesn't exist or isn't yours.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go home" })).toHaveAttribute("href", "/");
  });
});
