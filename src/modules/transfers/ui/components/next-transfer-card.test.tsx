import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import nextEn from "@/modules/transfers/messages/en/next.json";
import nextEs from "@/modules/transfers/messages/es/next.json";
import type { TransferDto } from "@/modules/transfers/service/schemas";
import { NextTransferCard } from "@/modules/transfers/ui/components/next-transfer-card";
import sharedEn from "@/shared/i18n/messages/en.json";
import sharedEs from "@/shared/i18n/messages/es.json";
import { renderWithIntl } from "../../../../../tests/setup/intl";

const en = { ...sharedEn, transfers: { next: nextEn } };
const es = { ...sharedEs, transfers: { next: nextEs } };

const NOW = Date.parse("2027-03-13T10:00:00Z");

function dto(overrides: Partial<TransferDto> = {}): TransferDto {
  return {
    id: "t1",
    gap: 0,
    mode: "flight",
    from: "Bogotá",
    to: "Cartagena",
    departDate: "2027-03-15",
    departTime: "09:40",
    departTz: "UTC",
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
    ...overrides,
  };
}

function renderNext(transfers: TransferDto[], locale: "en" | "es" = "en", now = NOW) {
  return renderWithIntl(<NextTransferCard transfers={transfers} now={now} />, {
    messages: locale === "en" ? en : es,
    locale,
  });
}

describe("NextTransferCard", () => {
  it("shows the cities and the countdown", () => {
    renderNext([dto()]);

    const card = screen.getByRole("region", { name: "Next up" });
    expect(card).toHaveTextContent("Bogotá");
    expect(card).toHaveTextContent("Cartagena");
    expect(card).toHaveTextContent("in 2 days");
  });

  it("links to the transfer on the page", () => {
    renderNext([dto()]);

    expect(screen.getByRole("link", { name: /Bogotá to Cartagena/ })).toHaveAttribute(
      "href",
      "#transfer-t1",
    );
  });

  it("says today and tomorrow instead of a number", () => {
    renderNext([dto({ departDate: "2027-03-13", departTime: "18:00" })]);
    expect(screen.getByRole("region", { name: "Next up" })).toHaveTextContent("today");
  });

  it("says tomorrow", () => {
    renderNext([dto({ departDate: "2027-03-14" })]);
    expect(screen.getByRole("region", { name: "Next up" })).toHaveTextContent("tomorrow");
  });

  it("shows the departure time when there is one", () => {
    renderNext([dto()]);

    expect(screen.getByRole("region", { name: "Next up" })).toHaveTextContent(/9:40\sAM/);
  });

  it("picks the next upcoming transfer, not a past one", () => {
    renderNext([
      dto({ id: "old", to: "Medellín", departDate: "2027-03-10", departTime: "08:00" }),
      dto({ id: "new" }),
    ]);

    const card = screen.getByRole("region", { name: "Next up" });
    expect(card).toHaveTextContent("Cartagena");
    expect(card).not.toHaveTextContent("Medellín");
  });

  it("renders nothing when no transfer is upcoming", () => {
    const { container } = renderNext([dto({ departDate: "2027-03-01", departTime: "08:00" })]);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing without transfers", () => {
    const { container } = renderNext([]);

    expect(container).toBeEmptyDOMElement();
  });

  it("speaks Spanish", () => {
    renderNext([dto()], "es");

    const card = screen.getByRole("region", { name: "Próximo traslado" });
    expect(card).toHaveTextContent("en 2 días");
  });
});
