import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Gap } from "@/modules/transfers/domain/gaps";
import cardMessages from "@/modules/transfers/messages/en/card.json";
import gapMessages from "@/modules/transfers/messages/en/gap.json";
import type { TransferDto } from "@/modules/transfers/service/schemas";
import { TransferGap } from "@/modules/transfers/ui/components/transfer-gap";
import sharedMessages from "@/shared/i18n/messages/en.json";
import { onAskAssistantForGap, onOpenTransferSheet } from "@/shared/ui/transfer-events";
import { renderWithIntl } from "../../../../../tests/setup/intl";

vi.mock("@/shared/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const messages = { ...sharedMessages, transfers: { gap: gapMessages, card: cardMessages } };

const cartagena = { name: "Cartagena", code: "CTG", tz: null };
const santaMarta = { name: "Santa Marta", code: "SMR", tz: null };
const bogota = { name: "Bogotá", code: "BOG", tz: null };

const between: Gap = {
  index: 1,
  kind: "between",
  from: cartagena,
  to: santaMarta,
  date: "2027-03-19",
  window: { from: "2027-03-15", to: "2027-03-19" },
};

const back: Gap = {
  index: 2,
  kind: "return",
  from: santaMarta,
  to: bogota,
  date: null,
  window: { from: "2027-03-19", to: null },
};

function dto(id: string, departTime: string): TransferDto {
  return {
    id,
    gap: 1,
    mode: "bus",
    from: "Cartagena",
    to: "Santa Marta",
    departDate: "2027-03-19",
    departTime,
    departTz: null,
    arriveDate: null,
    arriveTime: null,
    arriveTz: null,
    durationMinutes: null,
    dayOffset: 0,
    cost: null,
    currency: null,
    costInTripCurrency: null,
    charge: "all",
    participantIds: [],
    bookingRef: null,
    link: null,
    notes: null,
    needsReview: false,
    routeChanged: false,
    isPast: false,
    outsideWindow: false,
    version: 1,
  };
}

function renderGap(gap: Gap, transfers: TransferDto[] = [], hasAgent = true) {
  return renderWithIntl(<TransferGap gap={gap} transfers={transfers} hasAgent={hasAgent} />, {
    messages,
  });
}

const unsubscribers: (() => void)[] = [];
afterEach(() => {
  for (const off of unsubscribers.splice(0)) {
    off();
  }
});

describe("TransferGap", () => {
  it("asks how to get to the city when the gap is empty", () => {
    renderGap(between);

    const region = screen.getByRole("region", { name: "Getting to Santa Marta" });
    expect(within(region).getByText("How do you get to Santa Marta?")).toBeInTheDocument();
    expect(within(region).queryAllByRole("article")).toHaveLength(0);
  });

  it("asks how to get back when the empty gap is the return", () => {
    renderGap(back);

    const region = screen.getByRole("region", { name: "Return from Santa Marta" });
    expect(within(region).getByText("How do you get back to Bogotá?")).toBeInTheDocument();
  });

  it("offers Add and Find options in an empty gap", () => {
    renderGap(between);

    expect(screen.getByRole("button", { name: /^Add/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Find options/ })).toBeInTheDocument();
  });

  it("hides Find options when the agent is off", () => {
    renderGap(between, [], false);

    expect(screen.getByRole("button", { name: /^Add/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Find options/ })).toBeNull();
  });

  it("opens the sheet for this gap when Add is pressed", async () => {
    const listener = vi.fn();
    unsubscribers.push(onOpenTransferSheet(listener));
    renderGap(between);

    await userEvent.click(screen.getByRole("button", { name: /^Add/ }));

    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ gap: 1 }));
  });

  it("asks the assistant about this gap when Find options is pressed", async () => {
    const listener = vi.fn();
    unsubscribers.push(onAskAssistantForGap(listener));
    renderGap(between);

    await userEvent.click(screen.getByRole("button", { name: /^Find options/ }));

    expect(listener).toHaveBeenCalledWith({
      gap: 1,
      from: "Cartagena",
      to: "Santa Marta",
      date: "2027-03-19",
    });
  });

  it("lists each transfer as a card, in the order given, instead of the empty prompt", () => {
    renderGap(between, [dto("early", "08:00"), dto("late", "14:00")]);

    const region = screen.getByRole("region", { name: "Getting to Santa Marta" });
    const cards = within(region).getAllByRole("article");
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent(/8:00/);
    expect(cards[1]).toHaveTextContent(/2:00/);
    expect(within(region).queryByText("How do you get to Santa Marta?")).toBeNull();
  });

  it("still offers Add when the gap has transfers", () => {
    renderGap(between, [dto("early", "08:00")]);

    expect(screen.getByRole("button", { name: /^Add/ })).toBeInTheDocument();
  });
});
