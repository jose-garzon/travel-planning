import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import cardsMessages from "@/modules/trips/messages/en/cards.json";
import editMessages from "@/modules/trips/messages/en/edit.json";
import homeMessages from "@/modules/trips/messages/en/home.json";
import { HomeScreen } from "@/modules/trips/ui/components/home-screen";
import sharedMessages from "@/shared/i18n/messages/en.json";
import { renderWithIntl } from "../../../../../tests/setup/intl";

vi.mock("@/shared/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const messages = {
  ...sharedMessages,
  trips: { home: homeMessages, cards: cardsMessages, edit: editMessages },
};
const summary = { nextTrip: null, otherTrips: [] };

function renderHome(props: { justDeleted?: boolean }) {
  renderWithIntl(<HomeScreen displayName="Ana" summary={summary} today="2027-01-01" {...props} />, {
    messages,
  });
}

describe("HomeScreen", () => {
  it("confirms a deleted trip with a status toast", () => {
    renderHome({ justDeleted: true });

    expect(screen.getByRole("status")).toHaveTextContent("Trip deleted");
  });

  it("shows no confirmation otherwise", () => {
    renderHome({});

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
