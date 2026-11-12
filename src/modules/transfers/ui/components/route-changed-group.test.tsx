import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import cardMessages from "@/modules/transfers/messages/en/card.json";
import gapMessages from "@/modules/transfers/messages/en/gap.json";
import type { TransferDto } from "@/modules/transfers/service/schemas";
import { RouteChangedGroup } from "@/modules/transfers/ui/components/route-changed-group";
import sharedMessages from "@/shared/i18n/messages/en.json";
import { renderWithIntl } from "../../../../../tests/setup/intl";

vi.mock("@/shared/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const messages = { ...sharedMessages, transfers: { gap: gapMessages, card: cardMessages } };

function dto(id: string): TransferDto {
  return {
    id,
    gap: 7,
    mode: "bus",
    from: "Cartagena",
    to: "Santa Marta",
    departDate: "2027-03-19",
    departTime: null,
    departTz: null,
    arriveDate: null,
    arriveTime: null,
    arriveTz: null,
    durationMinutes: null,
    dayOffset: 0,
    cost: null,
    currency: null,
    costInTripCurrency: null,
    rate: null,
    charge: "all",
    participantIds: [],
    bookingRef: null,
    link: null,
    notes: null,
    needsReview: false,
    routeChanged: true,
    isPast: false,
    outsideWindow: false,
    version: 1,
  };
}

describe("RouteChangedGroup", () => {
  it("lists transfers whose gap left the route, each reachable by its id", () => {
    renderWithIntl(
      <RouteChangedGroup
        transfers={[dto("a"), dto("b")]}
        tripId="trip-1"
        viewerId="me"
        memberCount={2}
      />,
      { messages },
    );

    const region = screen.getByRole("region", { name: "Route changed" });
    expect(within(region).getAllByRole("article")).toHaveLength(2);
    expect(document.getElementById("transfer-a")).not.toBeNull();
    expect(document.getElementById("transfer-b")).not.toBeNull();
  });

  it("renders nothing without transfers", () => {
    const { container } = renderWithIntl(
      <RouteChangedGroup transfers={[]} tripId="trip-1" viewerId="me" memberCount={2} />,
      { messages },
    );

    expect(container).toBeEmptyDOMElement();
  });
});
