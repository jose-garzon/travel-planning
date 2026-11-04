import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import editMessages from "@/modules/trips/messages/en/edit.json";
import homeMessages from "@/modules/trips/messages/en/home.json";
import type { TripDto } from "@/modules/trips/service/schemas";
import { HomeScreen } from "@/modules/trips/ui/components/home-screen";
import sharedMessages from "@/shared/i18n/messages/en.json";
import { renderWithIntl } from "../../../../../tests/setup/intl";

vi.mock("@/shared/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const messages = { ...sharedMessages, trips: { home: homeMessages, edit: editMessages } };

function trip(id: string, name: string, from: string, to: string, date: string): TripDto {
  return {
    id,
    name,
    currency: "COP",
    version: 1,
    role: "owner",
    memberCount: 1,
    startDate: date,
    endDate: date,
    legs: [
      {
        from: { cityId: null, code: from.slice(0, 3).toUpperCase(), name: from },
        to: { cityId: null, code: to.slice(0, 3).toUpperCase(), name: to },
        date,
      },
    ],
  };
}

const empty = { nextTrip: null, otherTrips: [] };

function renderHome(props: {
  justDeleted?: boolean;
  leftTrip?: string;
  justRemoved?: boolean;
  summary?: typeof empty | object;
}) {
  renderWithIntl(
    <HomeScreen
      displayName="Ana"
      summary={(props.summary ?? empty) as never}
      today="2027-01-01"
      justDeleted={props.justDeleted}
      leftTrip={props.leftTrip}
      justRemoved={props.justRemoved}
    />,
    { messages },
  );
}

describe("HomeScreen", () => {
  it("confirms a deleted trip with a dismissible status toast", () => {
    renderHome({ justDeleted: true });

    expect(screen.getByRole("status")).toHaveTextContent("Trip deleted");
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText("Trip deleted")).not.toBeInTheDocument();
  });

  it("names the trip the member left", () => {
    renderHome({ leftTrip: "Europe" });

    expect(screen.getByRole("status")).toHaveTextContent("You left Europe");
  });

  it("tells a member removed from the trip that they are no longer in it", () => {
    renderHome({ justRemoved: true });

    expect(screen.getByRole("alert")).toHaveTextContent("You're no longer in this trip");
  });

  it("shows no confirmation otherwise", () => {
    renderHome({});

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("lists every trip as a row with its route, past trips under their own heading", () => {
    renderHome({
      summary: {
        nextTrip: trip("1", "Europe", "Bogota", "Madrid", "2027-02-10"),
        otherTrips: [
          trip("2", "Peru", "Lima", "Cusco", "2027-05-01"),
          trip("3", "Old", "Bogota", "Lima", "2026-01-01"),
        ],
      },
    });

    expect(screen.getByText("Route: Bogota → Madrid")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Peru/ })).toHaveAttribute("href", "/trips/2");
    expect(screen.getByRole("heading", { name: "Past trips" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Old/ })).toBeInTheDocument();
  });
});
