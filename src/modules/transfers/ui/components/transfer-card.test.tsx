import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import cardEn from "@/modules/transfers/messages/en/card.json";
import cardEs from "@/modules/transfers/messages/es/card.json";
import type { TransferDto } from "@/modules/transfers/service/schemas";
import { TransferCard } from "@/modules/transfers/ui/components/transfer-card";
import sharedEn from "@/shared/i18n/messages/en.json";
import sharedEs from "@/shared/i18n/messages/es.json";
import { onOpenTransferSheet } from "@/shared/ui/transfer-events";
import { renderWithIntl } from "../../../../../tests/setup/intl";

vi.mock("@/shared/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const en = { ...sharedEn, transfers: { card: cardEn } };
const es = { ...sharedEs, transfers: { card: cardEs } };

function dto(overrides: Partial<TransferDto> = {}): TransferDto {
  return {
    id: "t1",
    gap: 1,
    mode: "bus",
    from: "Cartagena",
    to: "Santa Marta",
    departDate: "2027-03-19",
    departTime: "08:00",
    departTz: "America/Bogota",
    arriveDate: "2027-03-19",
    arriveTime: "12:30",
    arriveTz: "America/Bogota",
    durationMinutes: 270,
    dayOffset: 0,
    cost: 2500,
    currency: "USD",
    costInTripCurrency: 10_000_000,
    charge: "all",
    participantIds: [],
    bookingRef: null,
    link: null,
    notes: null,
    needsReview: false,
    routeChanged: false,
    isPast: false,
    outsideWindow: false,
    version: 3,
    ...overrides,
  };
}

function renderCard(transfer: TransferDto, locale: "en" | "es" = "en") {
  return renderWithIntl(<TransferCard transfer={transfer} />, {
    messages: locale === "en" ? en : es,
    locale,
  });
}

const unsubscribers: (() => void)[] = [];
afterEach(() => {
  for (const off of unsubscribers.splice(0)) {
    off();
  }
});

describe("TransferCard", () => {
  it("shows the mode as text with the cities, the date and the times", () => {
    renderCard(dto());

    const card = screen.getByRole("article");
    expect(within(card).getByText("Bus")).toBeInTheDocument();
    expect(card).toHaveTextContent("Cartagena");
    expect(card).toHaveTextContent("Santa Marta");
    expect(card).toHaveTextContent(/Mar 19/);
    expect(card).toHaveTextContent(/8:00\sAM/);
    expect(card).toHaveTextContent(/12:30\sPM/);
  });

  it("shows the duration", () => {
    renderCard(dto());

    expect(screen.getByRole("article")).toHaveTextContent("4h 30m");
  });

  it("shows no duration when it is unknown", () => {
    renderCard(dto({ durationMinutes: null, arriveTime: null }));

    expect(screen.getByRole("article")).not.toHaveTextContent(/\dh|\dm\b/);
  });

  it("marks a next-day arrival with +1", () => {
    renderCard(dto({ dayOffset: 1, arriveDate: "2027-03-20" }));

    expect(screen.getByRole("article")).toHaveTextContent("+1");
  });

  it("marks no offset for a same-day arrival", () => {
    renderCard(dto());

    expect(screen.getByRole("article")).not.toHaveTextContent("+");
  });

  it("shows the price per traveler and who pays", () => {
    renderCard(dto());

    const card = screen.getByRole("article");
    expect(card).toHaveTextContent("$25 each");
    expect(card).toHaveTextContent("All travelers");
  });

  it("says Opt-in for an opt-in transfer", () => {
    renderCard(dto({ charge: "opt-in" }));

    expect(screen.getByRole("article")).toHaveTextContent("Opt-in");
  });

  it("says there is no price yet when the cost is missing", () => {
    renderCard(dto({ cost: null, currency: null, costInTripCurrency: null }));

    expect(screen.getByRole("article")).toHaveTextContent("No price yet");
  });

  it("shows the booking reference and a link that opens in a new tab", () => {
    renderCard(dto({ bookingRef: "AV9512", link: "https://example.com/booking" }));

    const card = screen.getByRole("article");
    expect(card).toHaveTextContent("AV9512");
    const link = within(card).getByRole("link", { name: /Open booking/ });
    expect(link).toHaveAttribute("href", "https://example.com/booking");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("shows the notes", () => {
    renderCard(dto({ notes: "Bring the passport" }));

    expect(screen.getByRole("article")).toHaveTextContent("Bring the passport");
  });

  it("wraps long city names in full", () => {
    const long = "Villa de San Cristóbal de las Casas del Valle de Jovel";
    renderCard(dto({ from: long }));

    expect(screen.getByRole("article")).toHaveTextContent(long);
  });

  it("warns when the route changed", () => {
    renderCard(dto({ routeChanged: true }));

    expect(screen.getByRole("article")).toHaveTextContent("Route changed. Check from/to");
  });

  it("warns when the transfer needs a review", () => {
    renderCard(dto({ needsReview: true }));

    expect(screen.getByRole("article")).toHaveTextContent("Check details");
  });

  it("warns when the date is outside the gap", () => {
    renderCard(dto({ outsideWindow: true }));

    expect(screen.getByRole("article")).toHaveTextContent("Doesn't match route dates");
  });

  it("shows no warning when all is well", () => {
    renderCard(dto());

    const card = screen.getByRole("article");
    expect(card).not.toHaveTextContent("Route changed");
    expect(card).not.toHaveTextContent("Check details");
    expect(card).not.toHaveTextContent("Doesn't match");
  });

  it("is read as one sentence", () => {
    renderCard(dto());

    const card = screen.getByRole("article", {
      name: /^Bus from Cartagena to Santa Marta, .*March 19.*, departs 8:00\sAM, arrives 12:30\sPM, 4 hours 30 minutes$/,
    });
    expect(card).toBeInTheDocument();
  });

  it("leaves duration and arrival out of the sentence when unknown", () => {
    renderCard(dto({ arriveTime: null, arriveDate: null, durationMinutes: null }));

    const card = screen.getByRole("article");
    expect(card).toHaveAccessibleName(expect.stringContaining("departs"));
    expect(card).not.toHaveAccessibleName(expect.stringContaining("arrives"));
  });

  it("writes times and duration the Spanish way", () => {
    renderCard(dto(), "es");

    const card = screen.getByRole("article");
    expect(card).toHaveTextContent("08:00");
    expect(card).toHaveTextContent("12:30");
    expect(card).toHaveTextContent(/4 h 30 min/);
    expect(card).toHaveTextContent("Autobús");
  });

  it("hands the transfer to the sheet when Edit is pressed", async () => {
    const listener = vi.fn();
    unsubscribers.push(onOpenTransferSheet(listener));
    renderCard(dto());

    await userEvent.click(screen.getByRole("button", { name: /^Edit/ }));

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        gap: 1,
        action: "edit",
        prefill: expect.objectContaining({
          id: "t1",
          version: 3,
          mode: "bus",
          from: "Cartagena",
          to: "Santa Marta",
          departDate: "2027-03-19",
          departTime: "08:00",
          cost: 25,
          currency: "USD",
          charge: "all",
        }),
      }),
    );
  });

  it("hands the transfer to the sheet to delete when Delete is pressed", async () => {
    const listener = vi.fn();
    unsubscribers.push(onOpenTransferSheet(listener));
    renderCard(dto());

    await userEvent.click(screen.getByRole("button", { name: /^Delete/ }));

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        gap: 1,
        action: "delete",
        prefill: expect.objectContaining({ id: "t1", version: 3 }),
      }),
    );
  });

  it("labels a past transfer as past", () => {
    renderCard(dto({ isPast: true }));

    expect(screen.getByRole("article")).toHaveTextContent("Past");
  });

  it("labels a past transfer in Spanish", () => {
    renderCard(dto({ isPast: true }), "es");

    expect(screen.getByRole("article")).toHaveTextContent("Pasado");
  });

  it("does not label an upcoming transfer as past", () => {
    renderCard(dto());

    expect(screen.getByRole("article")).not.toHaveTextContent("Past");
  });

  it("keeps the flags on a past transfer", () => {
    renderCard(dto({ isPast: true, routeChanged: true, needsReview: true }));

    const card = screen.getByRole("article");
    expect(card).toHaveTextContent("Route changed. Check from/to");
    expect(card).toHaveTextContent("Check details");
  });

  it("says the flags in Spanish", () => {
    renderCard(dto({ routeChanged: true, needsReview: true }), "es");

    const card = screen.getByRole("article");
    expect(card).toHaveTextContent("La ruta cambió. Revisa origen y destino");
    expect(card).toHaveTextContent("Revisa los datos");
  });
});
